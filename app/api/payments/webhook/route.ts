import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCourseUUID } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// ВАЖНО: Webhook от ЮКассы приходит без cookies пользователя!
// Поэтому используем createAdminClient (service_role) для обхода RLS

// Типы событий ЮКасса
interface YooKassaEvent {
  type: string
  event: string
  object: {
    id: string
    status: string
    amount: {
      value: string
      currency: string
    }
    created_at: string
    description: string
    metadata: {
      course_id?: string
      user_id: string
      payment_method: string
      type?: string
    }
    payment_method: {
      type: string
      id: string
    }
    paid: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: YooKassaEvent = await request.json()

    console.log('ЮКасса webhook:', JSON.stringify(body, null, 2))

    const { event, object: payment } = body

    if (!payment || !payment.id) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    if (!supabase) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY не настроен!')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Обрабатываем разные события
    switch (event) {
      case 'payment.succeeded':
        // Платеж успешен - обновляем статус и даем доступ к курсу
        await handlePaymentSuccess(supabase, payment)
        break

      case 'payment.canceled':
        // Платеж отменен
        await handlePaymentCanceled(supabase, payment)
        break

      case 'refund.succeeded':
        // Возврат средств
        await handleRefund(supabase, payment)
        break

      default:
        console.log(`Неизвестное событие: ${event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Ошибка обработки webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing error' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(supabase: any, payment: YooKassaEvent['object']) {
  console.log('🚀 Обработка успешного платежа:', payment.id)
  
  const paymentId = payment.id
  const { metadata } = payment
  const userId = metadata?.user_id
  const rawCourseId = metadata?.course_id
  const courseId = rawCourseId ? getCourseUUID(rawCourseId) : null
  const amountInKopecks = Math.round(parseFloat(payment.amount.value) * 100)
  const paymentType = metadata?.type || 'course_purchase'
  
  if (!userId) {
    console.error('❌ Нет user_id в metadata')
    return
  }

  // ПРОСТАЯ ЛОГИКА: Найти или создать платеж
  let paymentRecordId: string | null = null

  // Ищем платеж по yookassa_payment_id
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('user_id', userId)
    .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
    .maybeSingle()

  if (existingPayment) {
    paymentRecordId = existingPayment.id
    // Обновляем статус на completed
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', existingPayment.id)
    console.log('✅ Платеж обновлен:', existingPayment.id)
  } else {
    // Если не найден - ищем по сумме и курсу
    if (courseId) {
      const { data: paymentByCourse } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('amount', amountInKopecks)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (paymentByCourse) {
        paymentRecordId = paymentByCourse.id
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            metadata: {
              yookassa_payment_id: paymentId,
              paid: payment.paid
            }
          })
          .eq('id', paymentByCourse.id)
        console.log('✅ Платеж обновлен (найден по курсу):', paymentByCourse.id)
      }
    }

    // Если все еще не найден - создаем новый
    if (!paymentRecordId) {
      const rawPaymentMethod = metadata?.payment_method || payment.payment_method?.type || 'card'
      const dbPaymentMethod = rawPaymentMethod === 'sbp' ? 'card' : rawPaymentMethod

      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          ...(courseId && { course_id: courseId }),
          amount: amountInKopecks,
          currency: 'RUB',
          payment_method: dbPaymentMethod,
          status: 'completed',
          completed_at: new Date().toISOString(),
          is_full_access: false,
          metadata: {
            yookassa_payment_id: paymentId,
            type: paymentType,
            paid: payment.paid,
            original_payment_method: rawPaymentMethod,
          }
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Ошибка создания платежа:', createError)
      } else {
        paymentRecordId = newPayment.id
        console.log('✅ Платеж создан:', newPayment.id)
      }
    }
  }

  // Создаем enrollment для курса (только для course_purchase, не для final_modules)
  // Для final_modules enrollment уже должен существовать
  if (courseId && paymentType !== 'final_modules') {
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!existingEnrollment) {
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .upsert({
          user_id: userId,
          course_id: courseId,
          progress: 0,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        })

      if (enrollmentError) {
        console.error('❌ Ошибка создания enrollment:', enrollmentError)
      } else {
        console.log('✅ Enrollment создан для курса:', courseId)
      }
    } else {
      console.log('✅ Enrollment уже существует')
    }
  }
  
  // Для final_modules - только логируем (доступ проверяется через payments)
  if (paymentType === 'final_modules') {
    console.log('✅ Оплата финальных модулей успешна, доступ предоставлен')
  }

  // Создаем транзакцию
  const transactionType = paymentType === 'balance_topup' ? 'earned' : 'spent'
  
  // Проверяем есть ли уже транзакция
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('amount', amountInKopecks)
    .eq('type', transactionType)
    .eq('reference_type', paymentType)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
    .maybeSingle()

  if (!existingTx) {
    const transactionData: any = {
      user_id: userId,
      type: transactionType,
      amount: amountInKopecks,
      description: courseId ? `Оплата курса` : `Пополнение баланса`,
      reference_type: paymentType
    }

    if (courseId) {
      transactionData.reference_id = courseId
    }

    const { error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)

    if (txError) {
      console.error('❌ Ошибка создания транзакции:', txError)
    } else {
      console.log('✅ Транзакция создана')
    }
  } else {
    console.log('✅ Транзакция уже существует')
  }

  // Обновляем баланс для balance_topup
  if (paymentType === 'balance_topup') {
    const { data: balance } = await supabase
      .from('user_balance')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single()

    if (balance) {
      await supabase
        .from('user_balance')
        .update({
          balance: (balance.balance || 0) + amountInKopecks,
          total_earned: (balance.total_earned || 0) + amountInKopecks
        })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('user_balance')
        .insert({
          user_id: userId,
          balance: amountInKopecks,
          total_earned: amountInKopecks,
          total_withdrawn: 0
        })
    }
  }

  // КРИТИЧНО: Начисляем комиссию рефереру если это покупка курса
  if (courseId && paymentType === 'course_purchase') {
    // Ищем реферера (кто пригласил этого пользователя)
    const { data: referralInfo } = await supabase
      .from('referrals')
      .select('referrer_id, commission_percent, id')
      .eq('referred_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (referralInfo && referralInfo.referrer_id) {
      const referrerId = referralInfo.referrer_id
      const commissionPercent = referralInfo.commission_percent || 30.0
      const commissionAmount = Math.round(amountInKopecks * commissionPercent / 100)

      console.log(`💰 Начисляем комиссию рефереру: ${referrerId}, сумма: ${commissionAmount} копеек (${commissionPercent}%)`)

      // Создаем транзакцию комиссии для реферера
      const { error: commissionTxError } = await supabase
        .from('transactions')
        .insert({
          user_id: referrerId,
          type: 'earned',
          amount: commissionAmount,
          description: `Реферальная комиссия: ${commissionPercent}% с покупки курса`,
          reference_type: 'referral_commission',
          reference_id: courseId
        })

      if (commissionTxError) {
        console.error('❌ Ошибка создания транзакции комиссии:', commissionTxError)
      } else {
        console.log('✅ Транзакция комиссии создана для реферера')
      }

      // Обновляем referrer_earned в таблице referrals
      const { data: currentReferral } = await supabase
        .from('referrals')
        .select('referrer_earned')
        .eq('id', referralInfo.id)
        .maybeSingle()

      const newReferrerEarned = (currentReferral?.referrer_earned || 0) + commissionAmount

      const { error: updateReferralError } = await supabase
        .from('referrals')
        .update({
          referrer_earned: newReferrerEarned
        })
        .eq('id', referralInfo.id)

      if (updateReferralError) {
        console.error('❌ Ошибка обновления referrer_earned:', updateReferralError)
      } else {
        console.log('✅ referrer_earned обновлен')
      }

      // Обновляем баланс реферера
      const { data: referrerBalance } = await supabase
        .from('user_balance')
        .select('balance, total_earned')
        .eq('user_id', referrerId)
        .maybeSingle()

      if (referrerBalance) {
        const { error: updateBalanceError } = await supabase
          .from('user_balance')
          .update({
            balance: (referrerBalance.balance || 0) + commissionAmount,
            total_earned: (referrerBalance.total_earned || 0) + commissionAmount
          })
          .eq('user_id', referrerId)

        if (updateBalanceError) {
          console.error('❌ Ошибка обновления баланса реферера:', updateBalanceError)
        } else {
          console.log('✅ Баланс реферера обновлен')
        }
      } else {
        // Создаем баланс если его нет
        const { error: createBalanceError } = await supabase
          .from('user_balance')
          .insert({
            user_id: referrerId,
            balance: commissionAmount,
            total_earned: commissionAmount,
            total_withdrawn: 0
          })

        if (createBalanceError) {
          console.error('❌ Ошибка создания баланса реферера:', createBalanceError)
        } else {
          console.log('✅ Баланс реферера создан')
        }
      }

      // Обновляем total_earned в user_referral_codes реферера
      const { data: referrerCode } = await supabase
        .from('user_referral_codes')
        .select('total_earned')
        .eq('user_id', referrerId)
        .maybeSingle()

      if (referrerCode) {
        const { error: updateCodeError } = await supabase
          .from('user_referral_codes')
          .update({
            total_earned: (referrerCode.total_earned || 0) + commissionAmount
          })
          .eq('user_id', referrerId)

        if (updateCodeError) {
          console.error('❌ Ошибка обновления total_earned в user_referral_codes:', updateCodeError)
        } else {
          console.log('✅ total_earned в user_referral_codes обновлен')
        }
      }
    } else {
      console.log('ℹ️ Реферер не найден - комиссия не начисляется')
    }
  }

  // КРИТИЧНО: Создаем реферальный код автоматически если его нет (после покупки курса)
  if (courseId) {
    const { data: existingRefCode } = await supabase
      .from('user_referral_codes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingRefCode) {
      console.log('📝 Создаем реферальный код для пользователя после покупки курса')
      
      const generateCode = () => {
        const prefix = 'REF-'
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = prefix
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      let newRefCode = generateCode()
      let isUnique = false
      let attempts = 0

      // Генерируем уникальный код
      while (!isUnique && attempts < 10) {
        const { data: check } = await supabase
          .from('user_referral_codes')
          .select('id')
          .eq('referral_code', newRefCode)
          .maybeSingle()

        if (!check) {
          isUnique = true
        } else {
          newRefCode = generateCode()
          attempts++
        }
      }

      if (isUnique) {
        const { error: refCodeError } = await supabase
          .from('user_referral_codes')
          .insert({
            user_id: userId,
            referral_code: newRefCode,
            is_active: true,
            total_uses: 0,
            total_earned: 0
          })

        if (refCodeError) {
          console.error('❌ Ошибка создания реферального кода:', refCodeError)
        } else {
          console.log(`✅ Реферальный код создан автоматически: ${newRefCode}`)
        }
      }
    } else {
      console.log('✅ Реферальный код уже существует')
    }
  }

  console.log('✅✅✅ ПЛАТЕЖ ОБРАБОТАН УСПЕШНО - ENROLLMENT, ТРАНЗАКЦИЯ, КОМИССИЯ И РЕФЕРАЛЬНЫЙ КОД СОЗДАНЫ')
}

async function handlePaymentCanceled(supabase: any, payment: YooKassaEvent['object']) {
  const { metadata } = payment
  const userId = metadata?.user_id
  const paymentId = payment.id

  if (!userId) return

  await supabase
    .from('payments')
    .update({
      status: 'failed',
      metadata: {
        yookassa_payment_id: paymentId,
        canceled_at: new Date().toISOString()
      }
    })
    .eq('user_id', userId)
    .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
}

async function handleRefund(supabase: any, payment: YooKassaEvent['object']) {
  console.log('Возврат средств:', payment.id)
  // TODO: Реализовать логику возврата
}
