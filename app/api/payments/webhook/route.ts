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
  console.log('🚀 === START handlePaymentSuccess ===')
  console.log('📥 Получен платеж от YooKassa:', JSON.stringify(payment, null, 2))
  
  const paymentId = payment.id
  const { metadata } = payment
  const userId = metadata?.user_id
  const rawCourseId = metadata?.course_id
  const courseId = rawCourseId ? getCourseUUID(rawCourseId) : null
  
  console.log('🔍 Извлеченные данные:', {
    paymentId,
    userId,
    rawCourseId,
    courseId,
    metadata: JSON.stringify(metadata)
  })
  
  // Вычисляем основные значения заранее
  const amountInKopecks = Math.round(parseFloat(payment.amount.value) * 100)
  const paymentType = metadata?.type || 'course_purchase'
  
  console.log('💰 Параметры платежа:', {
    amountInKopecks,
    amountInRubles: amountInKopecks / 100,
    paymentType
  })
  
  // КРИТИЧЕСКАЯ ПРОВЕРКА: не обрабатывали ли мы уже этот платеж (idempotency)
  // Ищем платежи с таким же yookassa_payment_id в metadata (любой статус, чтобы поймать все случаи)
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('id, status, amount, completed_at')
    .eq('user_id', userId)
    .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
  
  // Если платеж уже существует и обработан - проверяем только наличие транзакций
  // НЕ выходим полностью, чтобы убедиться что все создано (enrollments, транзакции)
  if (existingPayments && existingPayments.length > 0) {
    const existingPayment = existingPayments[0]
    
    if (existingPayment.status === 'completed') {
      console.log('⚠️ Платеж уже был обработан ранее (completed), проверяем наличие транзакций:', paymentId, existingPayment.id)
      
      // Проверяем наличие транзакций
      if (paymentType === 'balance_topup') {
        const { count: balanceTxCount } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('amount', amountInKopecks)
          .eq('type', 'earned')
          .eq('reference_type', 'balance_topup')
          .gte('created_at', existingPayment.completed_at ? new Date(new Date(existingPayment.completed_at).getTime() - 60000).toISOString() : new Date(Date.now() - 86400000).toISOString())
      
        if (balanceTxCount && balanceTxCount > 0) {
          console.log('✅ Транзакция пополнения уже существует для этого платежа, пропускаем полностью')
          return
        } else {
          console.log('⚠️ Платеж completed но транзакции нет - будем создавать')
        }
      } else if (courseId) {
        // Проверяем наличие транзакции и enrollment
        const { count: purchaseTxCount } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('reference_id', courseId)
          .eq('reference_type', 'course_purchase')
          .eq('amount', amountInKopecks)
          .eq('type', 'spent')
          .gte('created_at', existingPayment.completed_at ? new Date(new Date(existingPayment.completed_at).getTime() - 60000).toISOString() : new Date(Date.now() - 86400000).toISOString())
        
        const { count: enrollmentCount } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('course_id', courseId)
        
        if (purchaseTxCount && purchaseTxCount > 0 && enrollmentCount && enrollmentCount > 0) {
          console.log('✅ Транзакция и enrollment уже существуют для этого платежа, пропускаем полностью')
          return
        } else {
          console.log('⚠️ Платеж completed но транзакция или enrollment отсутствуют - будем создавать', { purchaseTxCount, enrollmentCount })
        }
      }
      // Продолжаем обработку чтобы создать недостающие транзакции/enrollments
    } else {
      // Если статус pending, но мы уже начали обработку - проверяем есть ли транзакции
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('id, type, amount, reference_type')
        .eq('user_id', userId)
        .eq('amount', amountInKopecks)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // За последний час
        .limit(10)
      
      // Если найдены транзакции с такой же суммой за последний час - это дублирование
      if (existingTransactions && existingTransactions.length > 0) {
        console.log('⚠️ Обнаружены транзакции с такой же суммой за последний час для pending платежа, пропускаем:', existingTransactions)
        return
      }
    }
  }

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
  let paymentRecordId: string | null = null
  let paymentStatus: string | null = null
  
  console.log('🔍 Ищем платеж в БД по yookassa_payment_id:', paymentId)
  console.log('🔍 User ID для поиска:', userId)
  
  // Сначала попробуем найти все платежи этого пользователя (для отладки)
  const { data: allUserPayments, error: allPaymentsError } = await supabase
    .from('payments')
    .select('id, status, amount, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('📋 Последние 5 платежей пользователя:', {
    count: allUserPayments?.length || 0,
    payments: allUserPayments?.map((p: any) => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      metadata: p.metadata,
      yookassa_id_in_metadata: p.metadata?.yookassa_payment_id
    })),
    error: allPaymentsError
  })
  
  const { data: paymentToUpdate, error: searchError } = await supabase
    .from('payments')
    .select('id, status, metadata')
    .eq('user_id', userId)
    .filter('metadata->>yookassa_payment_id', 'eq', paymentId)
    .maybeSingle()
  
  console.log('🔍 Результат поиска по yookassa_payment_id:', {
    found: !!paymentToUpdate,
    paymentId: paymentToUpdate?.id,
    status: paymentToUpdate?.status,
    error: searchError
  })

  if (paymentToUpdate) {
    paymentRecordId = paymentToUpdate.id
    paymentStatus = paymentToUpdate.status
    // Обновляем найденный платеж (даже если уже completed - обновим metadata)
    if (paymentToUpdate.status === 'completed') {
      console.log('⚠️ Платеж уже имеет статус completed, обновляем metadata и продолжаем:', paymentId)
      // Обновляем только metadata, не меняя статус
      await supabase
        .from('payments')
        .update({
          metadata: {
            ...existingMetadata,
            yookassa_payment_id: payment.id,
            paid: payment.paid
          }
        })
        .eq('id', paymentToUpdate.id)
    } else {
      await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentToUpdate.id)
      console.log('✅ Платеж обновлен:', paymentToUpdate.id)
    }
  } else {
    // Если платеж не найден по yookassa_payment_id, ищем по другим критериям (fallback)
    console.log('⚠️ Платеж не найден по yookassa_payment_id, используем fallback поиск')
    let foundPayment = false
    
    if (courseId) {
      // Ищем по course_id и сумме (без статуса, чтобы найти любой)
      console.log('🔍 Fallback поиск: ищем по course_id, amount, user_id', { courseId, amountInKopecks, userId })
      
      const { data: fallbackPayment, error: fallbackError } = await supabase
        .from('payments')
        .select('id, status, metadata, amount')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('amount', amountInKopecks)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      console.log('🔍 Результат fallback поиска:', {
        found: !!fallbackPayment,
        paymentId: fallbackPayment?.id,
        status: fallbackPayment?.status,
        amount: fallbackPayment?.amount,
        metadata: fallbackPayment?.metadata,
        error: fallbackError
      })
      
      if (fallbackPayment) {
        paymentRecordId = fallbackPayment.id
        paymentStatus = fallbackPayment.status
        
        // Обновляем metadata чтобы добавить yookassa_payment_id
        const existingMetadata = fallbackPayment.metadata || {}
        const updatedMetadata = {
          ...existingMetadata,
          yookassa_payment_id: paymentId,
          paid: payment.paid
        }
        
        await supabase
          .from('payments')
          .update({
            ...updateData,
            metadata: updatedMetadata
          })
          .eq('id', fallbackPayment.id)
        console.log('✅ Платеж обновлен (fallback):', fallbackPayment.id)
        foundPayment = true
      }
    }
    
    if (!foundPayment) {
      // Для balance_topup ищем по сумме и типу
      if (paymentType === 'balance_topup') {
        const { data: fallbackPayment } = await supabase
          .from('payments')
          .select('id, status')
          .eq('user_id', userId)
          .eq('amount', amountInKopecks)
          .filter('metadata->>type', 'eq', 'balance_topup')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (fallbackPayment) {
          paymentRecordId = fallbackPayment.id
          paymentStatus = fallbackPayment.status
          await supabase
            .from('payments')
            .update(updateData)
            .eq('id', fallbackPayment.id)
          console.log('✅ Платеж обновлен (fallback balance_topup):', fallbackPayment.id)
          foundPayment = true
        }
      }
    }
    
    // Если платеж все равно не найден - создаем его (на случай если он не был создан при создании платежа)
    if (!foundPayment) {
      console.log('⚠️ Платеж не найден в БД, создаем новый запись о платеже')
      
      // Маппим методы оплаты на допустимые значения для БД
      const rawPaymentMethod = metadata?.payment_method || payment.payment_method?.type || 'card'
      const dbPaymentMethod = ['card', 'sbp', 'sber_pay', 'tinkoff_pay', 'yoomoney'].includes(rawPaymentMethod) 
        ? rawPaymentMethod 
        : 'card'
      
      const { data: newPayment, error: createPaymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          ...(courseId && { course_id: courseId }),
          amount: amountInKopecks,
          currency: 'RUB',
          payment_method: dbPaymentMethod,
          status: 'completed',
          is_full_access: false,
          completed_at: new Date().toISOString(),
          metadata: {
            yookassa_payment_id: paymentId,
            type: paymentType,
            paid: payment.paid,
            original_payment_method: rawPaymentMethod, // Сохраняем оригинальный метод
            created_from_webhook: true
          }
        })
        .select()
        .single()
      
      if (createPaymentError) {
        console.error('❌ Ошибка создания платежа из webhook:', createPaymentError)
      } else {
        paymentRecordId = newPayment.id
        paymentStatus = 'completed'
        console.log('✅ Платеж создан из webhook:', newPayment.id)
      }
    }
  }
  
  console.log('📋 ID платежа для дальнейшей обработки:', paymentRecordId)

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
    console.log('🔍 Проверяем наличие транзакции для balance_topup, paymentRecordId:', paymentRecordId)
    
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
      // ФИНАЛЬНАЯ ПРОВЕРКА: проверяем что для этого конкретного платежа еще нет транзакции
      // Это защита от повторных вызовов webhook'а
      if (paymentRecordId) {
        // Если платеж уже completed, проверяем есть ли транзакция созданная после его завершения
        const { count: txCountForPayment } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('amount', amountInKopecks)
          .eq('type', 'earned')
          .eq('reference_type', 'balance_topup')
          .eq('reference_id', paymentRecordId)
        
        if (txCountForPayment && txCountForPayment > 0) {
          console.log('⚠️ Для этого платежа (ID=' + paymentRecordId + ') уже создана транзакция, пропускаем')
          return
        }
      }
      
      const { data: newTransaction, error: transactionInsertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'earned',
          amount: amountInKopecks,
          description: `Пополнение баланса: ${payment.description}`,
          reference_type: 'balance_topup',
          reference_id: paymentRecordId // Сохраняем ID платежа для связи
        })
        .select()
        .single()
      
      if (transactionInsertError) {
        console.error('❌ Ошибка создания транзакции пополнения:', transactionInsertError)
      } else {
        console.log('✅ Транзакция пополнения создана:', 'ID:', newTransaction.id, 'Сумма:', amountInKopecks)
      }
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
      console.log('⚠️ Нет courseId для записи на курс, но продолжаем для создания транзакции:', { courseId, rawCourseId, userId, metadata })
      // НЕ возвращаемся, так как транзакция все равно должна быть создана если есть платеж
    }
    
    // Если есть courseId - создаем enrollment
    if (courseId) {

    console.log('=== Creating enrollment ===')
    console.log('User ID:', userId)
    console.log('Course ID:', courseId)
    console.log('Payment Record ID:', paymentRecordId)
    console.log('Payment Status:', paymentStatus)

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
        console.error('Детали ошибки:', JSON.stringify(enrollmentError, null, 2))
        
        // Попробуем upsert как fallback
        const { data: upsertResult, error: upsertError } = await supabase
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
          .select()
          .single()
        
        if (upsertError) {
          console.error('❌ Upsert тоже не сработал:', upsertError)
          console.error('Детали ошибки upsert:', JSON.stringify(upsertError, null, 2))
        } else {
          console.log('✅ Upsert успешен, enrollment создан:', upsertResult)
        }
      } else {
        console.log(`✅ Пользователь ${userId} записан на курс ${courseId}`, newEnrollment)
      }
    }
    } else {
      console.log('⚠️ courseId отсутствует, пропускаем создание enrollment')
    }

    // Используем сохраненный ID платежа (paymentRecordId уже получен выше)
    // Создаем транзакцию - проверка на дублирование уже выполнена выше в начале функции
    // Проверяем только для этого конкретного платежа и курса
    console.log('🔍 Проверяем наличие существующей транзакции...', { courseId, paymentType })
    
    let existingTransaction = null
    
    if (courseId) {
      // Для покупки курса проверяем по courseId
      const { data: tx } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('reference_id', courseId)
        .eq('reference_type', 'course_purchase')
        .eq('amount', amountInKopecks)
        .eq('type', 'spent')
        .gte('created_at', new Date(Date.now() - 86400000).toISOString()) // За последние 24 часа
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      existingTransaction = tx
    } else {
      // Если courseId нет, проверяем по сумме и типу за последние 24 часа
      const { data: tx } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('amount', amountInKopecks)
        .eq('type', 'spent')
        .eq('reference_type', paymentType)
        .gte('created_at', new Date(Date.now() - 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      existingTransaction = tx
    }
    
    if (!existingTransaction) {
      console.log('📝 Создаем новую транзакцию...')
      
      const transactionData: any = {
        user_id: userId,
        type: 'spent',
        amount: amountInKopecks,
        description: courseId ? `Оплата курса: ${payment.description}` : `Оплата: ${payment.description}`,
        reference_type: paymentType
      }
      
      // Добавляем reference_id только если есть courseId
      if (courseId) {
        transactionData.reference_id = courseId
      }
      
      console.log('Данные для транзакции:', transactionData)
      
      const { data: newTransaction, error: transactionInsertError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()
      
      if (transactionInsertError) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА создания транзакции:', transactionInsertError)
        console.error('Детали ошибки:', JSON.stringify(transactionInsertError, null, 2))
        console.error('Код ошибки:', transactionInsertError.code)
        console.error('Сообщение:', transactionInsertError.message)
        console.error('Детали:', transactionInsertError.details)
        console.error('Подсказка:', transactionInsertError.hint)
        
        // Попробуем создать без reference_id если была ошибка
        if (transactionInsertError.code === '23503' || transactionInsertError.message?.includes('foreign key')) {
          console.log('🔄 Пробуем создать транзакцию без reference_id (возможно проблема с foreign key)')
          const { data: fallbackTransaction, error: fallbackError } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              type: 'spent',
              amount: amountInKopecks,
              description: `Оплата: ${payment.description}`,
              reference_id: null,
              reference_type: paymentType
            })
            .select()
            .single()
          
          if (fallbackError) {
            console.error('❌ Fallback тоже не сработал:', fallbackError)
          } else {
            console.log('✅ Транзакция создана без reference_id:', fallbackTransaction.id)
          }
        }
      } else {
          console.log('✅✅✅ ТРАНЗАКЦИЯ УСПЕШНО СОЗДАНА:', {
          id: newTransaction.id,
          courseId,
          amount: amountInKopecks,
          amountRubles: amountInKopecks / 100,
          userId,
          paymentType
        })
      }
    } else {
      console.log('⚠️ Транзакция уже существует, пропускаем создание:', existingTransaction.id)
      // НЕ возвращаемся, так как реферальная комиссия может быть не начислена
    }

    // Генерируем реферальный код после ЛЮБОЙ первой транзакции или покупки курса если его нет
    // Проверяем есть ли транзакции ИЛИ enrollments (купленные курсы)
    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: enrollmentsCount } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { data: existingRefCode } = await supabase
      .from('user_referral_codes')
      .select('id')
      .eq('user_id', userId)
      .single()

    // Создаём реферальный код если есть транзакции ИЛИ enrollments, но нет кода
    const hasEligibility = (transactionsCount || 0) > 0 || (enrollmentsCount || 0) > 0
    if (hasEligibility && !existingRefCode) {
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
          console.log('⚠️ Транзакция покупки не найдена, пропускаем начисление реферальной комиссии (но продолжаем основную обработку)')
          // НЕ возвращаемся, так как это только реферальная комиссия
        } else {
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
        }
      } else {
        console.log('⚠️ Реферальная транзакция уже существует, пропускаем начисление:', existingRefTransaction.id)
      }
    }
    
    // === ФИНАЛЬНАЯ ПРОВЕРКА: убеждаемся что enrollment и транзакция созданы ===
    console.log('🔍 === ФИНАЛЬНАЯ ПРОВЕРКА ===')
    
    if (courseId) {
      console.log('🔍 Финальная проверка: проверяем наличие enrollment и транзакции для курса:', courseId)
      
      // Проверяем enrollment
      const { data: finalEnrollmentCheck } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()
      
      if (!finalEnrollmentCheck) {
        console.log('⚠️ ФИНАЛЬНАЯ ПРОВЕРКА: enrollment не найден, создаем принудительно')
        const { data: forcedEnrollment, error: forcedError } = await supabase
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
          .select()
          .single()
        
        if (forcedError) {
          console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: не удалось создать enrollment даже принудительно:', forcedError)
        } else {
          console.log('✅ Enrollment создан принудительно:', forcedEnrollment)
        }
      } else {
        console.log('✅ Enrollment существует:', finalEnrollmentCheck.id)
      }
    }
    
    // Проверяем транзакцию (для любого типа платежа)
    console.log('🔍 Финальная проверка транзакции...')
    let finalTransactionCheck = null
    
    if (courseId) {
      const { data: tx } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('reference_id', courseId)
        .eq('reference_type', 'course_purchase')
        .eq('amount', amountInKopecks)
        .eq('type', 'spent')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      finalTransactionCheck = tx
    } else {
      // Если courseId нет, ищем по сумме и типу
      const { data: tx } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('amount', amountInKopecks)
        .eq('type', 'spent')
        .eq('reference_type', paymentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      finalTransactionCheck = tx
    }
    
    if (!finalTransactionCheck) {
      console.log('⚠️ ФИНАЛЬНАЯ ПРОВЕРКА: транзакция не найдена, создаем принудительно')
      const forcedTxData: any = {
        user_id: userId,
        type: 'spent',
        amount: amountInKopecks,
        description: courseId ? `Оплата курса: ${payment.description}` : `Оплата: ${payment.description}`,
        reference_type: paymentType
      }
      
      if (courseId) {
        forcedTxData.reference_id = courseId
      }
      
      const { data: forcedTransaction, error: forcedTxError } = await supabase
        .from('transactions')
        .insert(forcedTxData)
        .select()
        .single()
      
      if (forcedTxError) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: не удалось создать транзакцию даже принудительно:', forcedTxError)
        console.error('Детали ошибки:', JSON.stringify(forcedTxError, null, 2))
      } else {
        console.log('✅✅✅ Транзакция создана принудительно:', forcedTransaction)
      }
    } else {
      console.log('✅ Транзакция существует:', finalTransactionCheck.id)
    }
    
    console.log('✅ === ФИНАЛЬНАЯ ПРОВЕРКА ЗАВЕРШЕНА ===')
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

