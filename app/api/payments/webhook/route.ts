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
  const paymentId = payment.id
  const { metadata } = payment
  const userId = metadata?.user_id
  const rawCourseId = metadata?.course_id
  const courseId = rawCourseId ? getCourseUUID(rawCourseId) : null
  
  // КРИТИЧЕСКАЯ ПРОВЕРКА: не обрабатывали ли мы уже этот платеж (idempotency)
  // Ищем платежи с таким же yookassa_payment_id в metadata (любой статус, чтобы поймать все случаи)
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('id, status, amount, completed_at')
    .eq('user_id', userId)
    .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
  
  // Если платеж уже существует и обработан - проверяем транзакции и выходим
  if (existingPayments && existingPayments.length > 0) {
    const existingPayment = existingPayments[0]
    
    if (existingPayment.status === 'completed') {
      console.log('⚠️ Платеж уже был обработан ранее (completed), проверяем транзакции:', paymentId, existingPayment.id)
      
      // Дополнительная проверка: ищем транзакции связанные с этим платежом
      const amountInKopecks = Math.round(parseFloat(payment.amount.value) * 100)
      const paymentType = metadata?.type || 'course_purchase'
      
      // Для balance_topup ищем транзакцию пополнения
      if (paymentType === 'balance_topup') {
        const { count: balanceTxCount } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('amount', amountInKopecks)
          .eq('type', 'earned')
          .eq('reference_type', 'balance_topup')
          .gte('created_at', existingPayment.completed_at ? new Date(new Date(existingPayment.completed_at).getTime() - 60000).toISOString() : new Date(Date.now() - 3600000).toISOString())
      
        if (balanceTxCount && balanceTxCount > 0) {
          console.log('✅ Транзакция пополнения уже существует для этого платежа, пропускаем полностью')
          return
        }
      } else if (courseId) {
        // Для покупки курса ищем транзакцию покупки
        const { count: purchaseTxCount } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('reference_id', courseId)
          .eq('reference_type', 'course_purchase')
          .eq('amount', amountInKopecks)
          .eq('type', 'spent')
          .gte('created_at', existingPayment.completed_at ? new Date(new Date(existingPayment.completed_at).getTime() - 60000).toISOString() : new Date(Date.now() - 3600000).toISOString())
        
        if (purchaseTxCount && purchaseTxCount > 0) {
          console.log('✅ Транзакция покупки уже существует для этого платежа, пропускаем полностью')
          return
        }
      }
      
      // Если платеж completed но транзакций нет - это странно, но пропускаем чтобы не создавать дубликаты
      console.log('⚠️ Платеж completed но транзакций не найдено, пропускаем для безопасности')
      return
    }
    
    // Если статус pending, но мы уже начали обработку - это может быть повторный webhook
    // Проверяем есть ли транзакции для этого платежа по сумме и времени
    const amountInKopecks = Math.round(parseFloat(payment.amount.value) * 100)
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('id, type, amount, reference_type')
      .eq('user_id', userId)
      .eq('amount', amountInKopecks)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // За последний час
      .limit(10)
    
    // Если найдены транзакции с такой же суммой за последний час - это дублирование
    if (existingTransactions && existingTransactions.length > 0) {
      console.log('⚠️ Обнаружены транзакции с такой же суммой за последний час, пропускаем обработку:', existingTransactions)
      return // ВАЖНО: выходим полностью, не продолжаем обработку
    }
  }

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

  // Обновляем статус платежа - находим конкретный платеж по yookassa_payment_id
  // Получаем существующие metadata из платежа
  let existingMetadata: any = {}
  if (existingPayments && existingPayments.length > 0) {
    const { data: paymentWithMetadata } = await supabase
      .from('payments')
      .select('metadata')
      .eq('id', existingPayments[0].id)
      .single()
    if (paymentWithMetadata?.metadata) {
      existingMetadata = paymentWithMetadata.metadata
    }
  }
  
  const updateData: any = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    metadata: {
      ...existingMetadata,
      yookassa_payment_id: payment.id,
      paid: payment.paid
    }
  }

  // Ищем платеж по yookassa_payment_id (самый надежный способ)
  const { data: paymentToUpdate } = await supabase
    .from('payments')
    .select('id, status')
    .eq('user_id', userId)
    .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
    .maybeSingle()

  if (paymentToUpdate) {
    // Обновляем найденный платеж
    if (paymentToUpdate.status === 'completed') {
      console.log('⚠️ Платеж уже имеет статус completed, пропускаем обновление:', paymentId)
      return
    }
    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentToUpdate.id)
    console.log('✅ Платеж обновлен:', paymentToUpdate.id)
  } else {
    // Если платеж не найден по yookassa_payment_id, ищем по другим критериям (fallback)
    console.log('⚠️ Платеж не найден по yookassa_payment_id, используем fallback поиск')
    if (courseId) {
      const { data: fallbackPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'pending')
        .eq('amount', amountInKopecks)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (fallbackPayment) {
        await supabase
          .from('payments')
          .update(updateData)
          .eq('id', fallbackPayment.id)
        console.log('✅ Платеж обновлен (fallback):', fallbackPayment.id)
      } else {
        console.error('❌ Платеж не найден в БД для обновления')
        return
      }
    } else {
      // Для balance_topup ищем по сумме и статусу
      const { data: fallbackPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('amount', amountInKopecks)
        .filter('metadata->>type', 'eq', 'balance_topup')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (fallbackPayment) {
        await supabase
          .from('payments')
          .update(updateData)
          .eq('id', fallbackPayment.id)
        console.log('✅ Платеж обновлен (fallback balance_topup):', fallbackPayment.id)
      } else {
        console.error('❌ Платеж не найден в БД для обновления')
        return
      }
    }
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
    // Используем более широкий временной диапазон и проверяем по payment_id через платежи
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
      .eq('status', 'completed')
      .maybeSingle()
    
    const { data: existingBalanceTransaction } = await supabase
      .from('transactions')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('reference_type', 'balance_topup')
      .eq('amount', amountInKopecks)
      .eq('type', 'earned')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // За последний час (увеличено для надежности)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!existingBalanceTransaction) {
      // ФИНАЛЬНАЯ ПРОВЕРКА: проверяем что для этого конкретного платежа (по yookassa_payment_id) еще нет транзакции
      // Это защита от повторных вызовов webhook'а
      const { data: paymentRecordForCheck } = await supabase
        .from('payments')
        .select('id, completed_at')
        .eq('user_id', userId)
        .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
        .eq('status', 'completed')
        .maybeSingle()
      
      if (paymentRecordForCheck) {
        // Если платеж уже completed, проверяем есть ли транзакция созданная после его завершения
        const { count: txCountForPayment } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('amount', amountInKopecks)
          .eq('type', 'earned')
          .eq('reference_type', 'balance_topup')
          .gte('created_at', paymentRecordForCheck.completed_at ? new Date(new Date(paymentRecordForCheck.completed_at).getTime() - 60000).toISOString() : new Date(Date.now() - 3600000).toISOString())
        
      if (txCountForPayment && txCountForPayment > 0) {
        console.log('⚠️ Для этого платежа (yookassa_payment_id=' + paymentId + ') уже создана транзакция, пропускаем')
        return
      }
    }
      
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'earned',
        amount: amountInKopecks,
        description: `Пополнение баланса: ${payment.description}`,
        reference_type: 'balance_topup',
        reference_id: paymentRecord?.id || null // Сохраняем ID платежа для связи
      })
      console.log('✅ Транзакция пополнения создана')
    } else {
      console.log('⚠️ Транзакция пополнения уже существует, пропускаем создание:', existingBalanceTransaction.id)
      // Проверяем, не нужно ли откатить начисление баланса (если оно было сделано до проверки транзакции)
      const { data: currentBalance } = await supabase
        .from('user_balance')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single()
      
      if (currentBalance) {
        // Считаем правильный баланс из транзакций
        const { data: earnedTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'earned')
          .in('reference_type', ['balance_topup', 'referral_commission'])
        
        const { data: withdrawnTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'withdrawn')
        
        const totalEarnedFromTransactions = (earnedTransactions || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
        const totalWithdrawnFromTransactions = (withdrawnTransactions || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
        
        // Если баланс не соответствует транзакциям - исправляем (но только если транзакция уже была создана ранее)
        const expectedBalance = totalEarnedFromTransactions - totalWithdrawnFromTransactions
        if (Math.abs(currentBalance.balance - expectedBalance) > 0) {
          console.log(`⚠️ Обнаружено расхождение баланса: ${currentBalance.balance} vs ожидаемый ${expectedBalance}`)
          // Не исправляем автоматически, только логируем
        }
      }
      
      return // Выходим, если транзакция уже есть
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

    // Получаем ID платежа для связи транзакций
    const { data: paymentRecord } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
      .eq('status', 'completed')
      .maybeSingle()
    
    // Создаем транзакцию ПЕРЕД проверкой реферального кода
    // Проверяем, не создана ли уже транзакция для этого платежа (защита от дублирования)
    // Используем более строгую проверку - по платежу через payment_id
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_id', courseId)
      .eq('reference_type', 'course_purchase')
      .eq('amount', amountInKopecks)
      .eq('type', 'spent')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // За последний час
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (!existingTransaction) {
      // ФИНАЛЬНАЯ ПРОВЕРКА: проверяем что для этого конкретного платежа (по yookassa_payment_id) еще нет транзакции
      const { data: paymentRecordForCheck } = await supabase
        .from('payments')
        .select('id, completed_at')
        .eq('user_id', userId)
        .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
        .eq('status', 'completed')
        .maybeSingle()
      
      if (paymentRecordForCheck) {
        // Если платеж уже completed, проверяем есть ли транзакция покупки созданная после его завершения
        const { count: txCountForPayment } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('reference_id', courseId)
          .eq('reference_type', 'course_purchase')
          .eq('amount', amountInKopecks)
          .eq('type', 'spent')
          .gte('created_at', paymentRecordForCheck.completed_at ? new Date(new Date(paymentRecordForCheck.completed_at).getTime() - 60000).toISOString() : new Date(Date.now() - 3600000).toISOString())
        
        if (txCountForPayment && txCountForPayment > 0) {
          console.log('⚠️ Для этого платежа (yookassa_payment_id=' + paymentId + ') уже создана транзакция покупки, пропускаем')
          return
        }
      }
      
      // Дополнительная проверка: ищем другие транзакции с такой же суммой за последний час
      const { count: similarTransactionsCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('amount', amountInKopecks)
        .eq('type', 'spent')
        .eq('reference_type', 'course_purchase')
        .eq('reference_id', courseId)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      
      if (similarTransactionsCount && similarTransactionsCount > 0) {
        console.log('⚠️ Обнаружены транзакции покупки этого курса с такой же суммой, пропускаем')
        return
      }
      
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
      // НЕ возвращаемся, так как реферальная комиссия может быть не начислена
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

      // Транзакция для реферера (проверка на дубликат ПЕРЕД начислением баланса)
      // Используем строгую проверку по платежу и времени
      const { data: existingRefTransaction } = await supabase
        .from('transactions')
        .select('id, created_at')
        .eq('user_id', referralRecord.referrer_id)
        .eq('reference_id', courseId)
        .eq('reference_type', 'referral_commission')
        .eq('amount', commissionAmount)
        .eq('type', 'referral_commission')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // За последний час
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (!existingRefTransaction) {
        // Дополнительная проверка: проверяем что платеж действительно обработан и транзакция покупки создана
        const { data: purchaseTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('reference_id', courseId)
          .eq('reference_type', 'course_purchase')
          .eq('amount', amountInKopecks)
          .eq('type', 'spent')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())
          .limit(1)
          .maybeSingle()
        
        if (!purchaseTransaction) {
          console.log('⚠️ Транзакция покупки не найдена, пропускаем начисление реферальной комиссии')
          return
        }
        // Начисляем комиссию рефереру только если транзакции еще нет
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
        await supabase.from('transactions').insert({
          user_id: referralRecord.referrer_id,
          type: 'referral_commission',
          amount: commissionAmount,
          description: `Реферальная комиссия ${commissionPercent}% с покупки курса`,
          reference_id: courseId,
          reference_type: 'referral_commission',
          referral_id: referralRecord.id
        })
        console.log('✅ Реферальная транзакция создана для реферера:', referralRecord.referrer_id)

        // Обновляем статистику реферала (только если транзакция была создана)
        await supabase
          .from('referrals')
          .update({
            total_earned_from_purchases: supabase.raw(`COALESCE(total_earned_from_purchases, 0) + ${commissionAmount}`)
          })
          .eq('id', referralRecord.id)

        // Обновляем статистику реферального кода (только если транзакция была создана)
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
      } else {
        console.log('⚠️ Реферальная транзакция уже существует, пропускаем начисление:', existingRefTransaction.id)
      }
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

