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
  const { metadata } = payment
  // Конвертируем старые ID в UUID
  const rawCourseId = metadata?.course_id
  const courseId = rawCourseId ? getCourseUUID(rawCourseId) : null
  const userId = metadata?.user_id
  const paymentType = metadata?.type || 'course_purchase'

  console.log('=== handlePaymentSuccess ===')
  console.log('Payment ID:', payment.id)
  console.log('Metadata:', JSON.stringify(metadata))
  console.log('Raw Course ID:', rawCourseId)
  console.log('UUID Course ID:', courseId)
  console.log('User ID:', userId)
  console.log('Payment Type:', paymentType)

  if (!userId || userId === 'guest') {
    console.log('❌ Нет данных пользователя:', { userId })
    return
  }

  const amountInKopecks = Math.round(parseFloat(payment.amount.value) * 100)
  console.log('Amount in kopecks:', amountInKopecks)

  // Обновляем статус платежа
  const updateData: any = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    metadata: {
      yookassa_payment_id: payment.id,
      paid: payment.paid
    }
  }

  if (courseId) {
    await supabase
      .from('payments')
      .update(updateData)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'pending')
  } else {
    await supabase
      .from('payments')
      .update(updateData)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
  }

  // Обрабатываем в зависимости от типа платежа
  if (paymentType === 'balance_topup') {
    // Пополнение баланса
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id_param: userId,
      amount_param: amountInKopecks
    })

    if (balanceError) {
      // Если функция не существует, используем прямой запрос
      const { data: currentBalance } = await supabase
        .from('user_balance')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single()

      if (currentBalance) {
        await supabase
          .from('user_balance')
          .update({
            balance: (currentBalance.balance || 0) + amountInKopecks,
            total_earned: (currentBalance.total_earned || 0) + amountInKopecks
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

      console.log(`Баланс пользователя ${userId} пополнен на ${amountInKopecks / 100}₽`)
    }

    // Создаем транзакцию для пополнения
    // Проверяем, не создана ли уже транзакция (защита от дублирования)
    const { data: existingBalanceTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_type', 'balance_topup')
      .eq('amount', amountInKopecks)
      .eq('type', 'earned')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // За последнюю минуту
      .single()
    
    if (!existingBalanceTransaction) {
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'earned',
        amount: amountInKopecks,
        description: `Пополнение баланса: ${payment.description}`,
        reference_type: 'balance_topup'
      })
      console.log('✅ Транзакция пополнения создана')
    } else {
      console.log('⚠️ Транзакция пополнения уже существует, пропускаем создание:', existingBalanceTransaction.id)
    }
  } else {
    // Покупка курса
    if (!courseId) {
      console.log('Нет данных для записи на курс:', { courseId, userId })
      return
    }

    console.log('=== Creating enrollment ===')
    console.log('User ID:', userId)
    console.log('Course ID:', courseId)

    // Сначала проверяем существует ли уже enrollment
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    console.log('Existing enrollment check:', { existingEnrollment, checkError: checkError?.message })

    if (existingEnrollment) {
      console.log('✅ Enrollment уже существует:', existingEnrollment.id)
    } else {
      // Создаем новую запись
      const { data: newEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          progress: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (enrollmentError) {
        console.error('❌ Ошибка создания записи на курс:', enrollmentError)
        
        // Попробуем upsert как fallback
        const { error: upsertError } = await supabase
          .from('enrollments')
          .upsert({
            user_id: userId,
            course_id: courseId,
            progress: 0,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,course_id',
            ignoreDuplicates: true
          })
        
        if (upsertError) {
          console.error('❌ Upsert тоже не сработал:', upsertError)
        } else {
          console.log('✅ Upsert успешен')
        }
      } else {
        console.log(`✅ Пользователь ${userId} записан на курс ${courseId}`, newEnrollment)
      }
    }

    // Создаем транзакцию ПЕРЕД проверкой реферального кода
    // Проверяем, не создана ли уже транзакция для этого платежа (защита от дублирования)
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_id', courseId)
      .eq('reference_type', 'course_purchase')
      .eq('amount', amountInKopecks)
      .eq('type', 'spent')
      .single()
    
    if (!existingTransaction) {
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'spent',
        amount: amountInKopecks,
        description: `Оплата курса: ${payment.description}`,
        reference_id: courseId,
        reference_type: 'course_purchase'
      })
      console.log('✅ Транзакция создана для курса:', courseId)
    } else {
      console.log('⚠️ Транзакция уже существует, пропускаем создание:', existingTransaction.id)
    }

    // Генерируем реферальный код после ЛЮБОЙ первой транзакции если его нет
    // Проверяем есть ли уже транзакции (не только enrollments!)
    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { data: existingRefCode } = await supabase
      .from('user_referral_codes')
      .select('id')
      .eq('user_id', userId)
      .single()

    // Создаём реферальный код если есть транзакции но нет кода
    if ((transactionsCount || 0) > 0 && !existingRefCode) {
      // Генерируем код
      const generateCode = () => {
        const prefix = 'REF-'
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = prefix
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      const newRefCode = generateCode()
      const { error: refError } = await supabase
        .from('user_referral_codes')
        .insert({
          user_id: userId,
          referral_code: newRefCode,
          is_active: true,
          total_uses: 0,
          total_earned: 0
        })

      if (refError) {
        console.error('Ошибка создания реф кода:', refError)
      } else {
        console.log(`✅ Создан реферальный код ${newRefCode} для пользователя ${userId} после транзакции`)
      }
    }

    // === Начисление реферальной комиссии ===
    // Проверяем есть ли у покупателя реферер
    const { data: referralRecord } = await supabase
      .from('referrals')
      .select('id, referrer_id, commission_percent')
      .eq('referred_id', userId)
      .eq('status', 'active')
      .single()

    if (referralRecord) {
      const commissionPercent = referralRecord.commission_percent || 30
      const commissionAmount = Math.round(amountInKopecks * commissionPercent / 100)
      
      console.log(`=== Реферальная комиссия ===`)
      console.log(`Реферер: ${referralRecord.referrer_id}`)
      console.log(`Процент: ${commissionPercent}%`)
      console.log(`Сумма покупки: ${amountInKopecks/100}₽`)
      console.log(`Комиссия: ${commissionAmount/100}₽`)

      // Начисляем комиссию рефереру
      const { data: referrerBalance } = await supabase
        .from('user_balance')
        .select('balance, total_earned')
        .eq('user_id', referralRecord.referrer_id)
        .single()

      if (referrerBalance) {
        await supabase
          .from('user_balance')
          .update({
            balance: (referrerBalance.balance || 0) + commissionAmount,
            total_earned: (referrerBalance.total_earned || 0) + commissionAmount
          })
          .eq('user_id', referralRecord.referrer_id)
      } else {
        await supabase
          .from('user_balance')
          .insert({
            user_id: referralRecord.referrer_id,
            balance: commissionAmount,
            total_earned: commissionAmount,
            total_withdrawn: 0
          })
      }

      // Транзакция для реферера
      await supabase.from('transactions').insert({
        user_id: referralRecord.referrer_id,
        type: 'referral_commission',
        amount: commissionAmount,
        description: `Реферальная комиссия ${commissionPercent}% с покупки курса`,
        reference_id: courseId,
        reference_type: 'referral_commission',
        referral_id: referralRecord.id
      })

      // Обновляем статистику реферала
      await supabase
        .from('referrals')
        .update({
          total_earned_from_purchases: supabase.raw(`COALESCE(total_earned_from_purchases, 0) + ${commissionAmount}`)
        })
        .eq('id', referralRecord.id)

      // Обновляем статистику реферального кода
      const { data: codeRecord } = await supabase
        .from('user_referral_codes')
        .select('total_earned')
        .eq('user_id', referralRecord.referrer_id)
        .single()

      if (codeRecord) {
        await supabase
          .from('user_referral_codes')
          .update({
            total_earned: (codeRecord.total_earned || 0) + commissionAmount
          })
          .eq('user_id', referralRecord.referrer_id)
      }

      console.log(`✅ Комиссия ${commissionAmount/100}₽ начислена рефереру ${referralRecord.referrer_id}`)
    }
  }
}

async function handlePaymentCanceled(supabase: any, payment: YooKassaEvent['object']) {
  const { metadata } = payment
  const userId = metadata?.user_id
  const courseId = metadata?.course_id

  if (!userId || userId === 'guest') return

  await supabase
    .from('payments')
    .update({
      status: 'failed',
      metadata: {
        yookassa_payment_id: payment.id,
        canceled_at: new Date().toISOString()
      }
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'pending')
}

async function handleRefund(supabase: any, payment: YooKassaEvent['object']) {
  const { metadata } = payment
  const userId = metadata?.user_id
  const courseId = metadata?.course_id

  if (!userId || userId === 'guest') return

  // Обновляем статус платежа
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      metadata: {
        refunded_at: new Date().toISOString()
      }
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)

  // Удаляем запись о зачислении
  await supabase
    .from('enrollments')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId)

  // Создаем транзакцию возврата
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'refund',
    amount: Math.round(parseFloat(payment.amount.value) * 100),
    description: `Возврат за курс: ${payment.description}`,
    reference_id: courseId,
    reference_type: 'course_refund'
  })
}

