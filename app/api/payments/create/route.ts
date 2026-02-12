import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCourseUUID } from '@/lib/constants'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

// Типы для ЮКасса
interface YooKassaPayment {
  id: string
  status: string
  amount: {
    value: string
    currency: string
  }
  confirmation: {
    type: string
    confirmation_url: string
  }
  created_at: string
  description: string
  metadata: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId: rawCourseId, paymentMethod, amount, userId, returnUrl, type, metadata, receipt, promocode } = body
    
    // Конвертируем старые ID ('1', '2') в UUID для БД
    const courseId = rawCourseId ? getCourseUUID(rawCourseId) : null
    
    console.log('=== PAYMENT CREATE ===')
    console.log('Raw courseId:', rawCourseId)
    console.log('UUID courseId:', courseId)
    console.log('userId:', userId)
    console.log('amount:', amount)

    // Проверяем обязательные параметры
    // ВАЖНО: Минимальная сумма для ЮКассы - 1₽ (100 копеек)
    if (type === 'balance_topup') {
      // Для пополнения баланса нужна только сумма
      if (!amount || amount < 100) { // Минимум 1₽ в копейках
        return NextResponse.json(
          { error: 'Минимальная сумма пополнения: 1₽' },
          { status: 400 }
        )
      }
    } else {
      const promotionId = metadata?.promotion_id
      
      // Для покупки курса нужны курс и сумма (кроме акции "2 курса")
      if (type === 'promotion' && promotionId === 'two_courses') {
        // Для акции "2 курса" не требуется courseId
        if (!amount) {
          return NextResponse.json(
            { error: 'Не указана сумма' },
            { status: 400 }
          )
        }
      } else {
        // Для обычной покупки курса нужен курс и сумма
        // Проверяем, что amount не меньше минимальной суммы (100 копеек = 1 рубль)
        if (!courseId || !amount || amount < 100) {
          if (!courseId || !amount) {
            return NextResponse.json(
              { error: 'Не указан курс или сумма' },
              { status: 400 }
            )
          }
          if (amount < 100) {
            return NextResponse.json(
              { error: 'Минимальная сумма оплаты: 1₽. Скидка не может превышать стоимость курса.' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Получаем данные ЮКасса из env
    const shopId = process.env.YOOKASSA_SHOP_ID
    const secretKey = process.env.YOOKASSA_SECRET_KEY

    // Дебаг: проверяем что именно получили
    console.log('=== DEBUG YOOKASSA ===')
    console.log('shopId:', shopId ? `${shopId.substring(0, 3)}...` : 'ОТСУТСТВУЕТ')
    console.log('secretKey:', secretKey ? `${secretKey.substring(0, 10)}...` : 'ОТСУТСТВУЕТ')
    console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('YOOKASSA')))

    if (!shopId || !secretKey) {
      console.error('ЮКасса не настроена: отсутствуют YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY')
      return NextResponse.json(
        { error: 'Платежная система не настроена' },
        { status: 500 }
      )
    }

    // Генерируем уникальный idempotency key (макс 64 символа для ЮKassa)
    // Используем короткий формат: первые 8 символов UUID + timestamp
    const shortCourseId = courseId ? courseId.substring(0, 8) : 'none'
    const shortUserId = userId ? userId.substring(0, 8) : 'guest'
    const timestamp = Date.now().toString(36) // Короткий timestamp в base36
    
    const idempotencyKey = type === 'balance_topup' 
      ? `bal-${shortUserId}-${timestamp}`
      : `pay-${shortCourseId}-${shortUserId}-${timestamp}`
    
    console.log('Idempotency key:', idempotencyKey, 'length:', idempotencyKey.length)

    // Определяем тип платежа для ЮКасса
    // Для СБП и СберПей используем payment_method_types, для остальных - payment_method_data
    const getPaymentMethodType = (method: string): string => {
      switch (method) {
        case 'sbp':
          return 'sbp'
        case 'sber_pay':
          return 'sberbank'
        case 'yoomoney':
          return 'yoo_money'
        case 'card':
        default:
          return 'bank_card'
      }
    }

    const paymentMethodType = getPaymentMethodType(paymentMethod || 'card')

    // Проверяем акцию "first_100" - доступна только тем, кто еще не купил ни одного курса
    const promotionId = metadata?.promotion_id
    if (type === 'promotion' && promotionId === 'first_100') {
      if (!userId || userId === 'guest') {
        return NextResponse.json(
          { error: 'Необходима авторизация для использования акции' },
          { status: 401 }
        )
      }

      const adminSupabase = createAdminClient()
      if (adminSupabase) {
        // ВАЖНО: Проверяем, купил ли пользователь уже хотя бы один курс (не важно, по акции или нет)
        const { data: userEnrollments, error: checkError } = await adminSupabase
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .limit(1)

        if (checkError) {
          console.error('Error checking user enrollments:', checkError)
          return NextResponse.json(
            { error: 'Ошибка проверки акции' },
            { status: 500 }
          )
        }

        if (userEnrollments && userEnrollments.length > 0) {
          return NextResponse.json(
            { error: 'Акция доступна только для новых студентов, которые еще не приобрели ни одного курса.' },
            { status: 400 }
          )
        }

        // Проверяем, есть ли еще свободные места (максимум 100 уникальных пользователей, которые купили хотя бы один курс)
        const { data: allEnrollments, error: countError } = await adminSupabase
          .from('enrollments')
          .select('user_id')

        if (!countError && allEnrollments) {
          const uniqueUserIds = new Set<string>()
          allEnrollments.forEach(enrollment => {
            if (enrollment.user_id) {
              uniqueUserIds.add(enrollment.user_id)
            }
          })

          if (uniqueUserIds.size >= 100) {
            return NextResponse.json(
              { error: 'Акция закончилась. Все 100 мест заняты.' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Получаем информацию о курсе и пользователе для чека
    let courseTitle: string | null = null
    let finalReceipt = receipt
    
    const supabaseForData = createAdminClient() || await createClient()
    if (courseId && supabaseForData) {
      // Получаем название курса
      const { data: courseData } = await supabaseForData
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle()
      
      if (courseData?.title) {
        courseTitle = courseData.title
      }
    }
    
    // Получаем email/phone из БД если не переданы в receipt
    if (userId && (!receipt || (!receipt.email && !receipt.phone))) {
      const supabase = await createClient()
      const userFromDb = await getUserFromSession(supabase)
      
      if (userFromDb && userFromDb.id === userId) {
        finalReceipt = {
          email: receipt?.email || userFromDb.email || '',
          phone: receipt?.phone || userFromDb.phone || ''
        }
      }
    }

    // Проверяем наличие email или phone
    if (!finalReceipt || (!finalReceipt.email && !finalReceipt.phone)) {
      return NextResponse.json(
        { error: 'Необходимо указать email или телефон для получения чека' },
        { status: 400 }
      )
    }

    // URL для webhook от ЮКассы
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://course-sport.vercel.app'}/api/payments/webhook`
    
    // Создаем платеж в ЮКасса
    const paymentData: any = {
      amount: {
        value: (amount / 100).toFixed(2), // Конвертируем копейки в рубли
        currency: 'RUB'
      },
      capture: true, // Автоматическое подтверждение
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?course=${courseId || ''}`
      },
      // Добавляем webhook URL для получения уведомлений о статусе платежа
      ...(webhookUrl && {
        save_payment_method: false,
        // ЮКасса автоматически отправляет webhook на этот URL при изменении статуса
      }),
      description: type === 'balance_topup' 
        ? `Пополнение баланса на ${(amount / 100).toFixed(2)}₽`
        : type === 'promotion' && metadata?.promotion_id === 'two_courses'
        ? `Оплата 2 курсов по акции (2499₽)`
        : type === 'promotion' && metadata?.promotion_id === 'first_100'
        ? `Оплата курса по акции "Первым 1000 студентам" (1099₽)`
        : type === 'final_modules'
        ? `Оплата финальных модулей курса #${courseId}`
        : `Оплата курса #${courseId}`,
      // Всегда формируем receipt для покупателя (если есть email или телефон)
      // ВАЖНО: receipt требует items, поэтому добавляем их
      ...(finalReceipt && (finalReceipt.email || finalReceipt.phone) && {
        receipt: {
          customer: {
            ...(finalReceipt.email && finalReceipt.email.includes('@') && { email: finalReceipt.email }),
            ...(finalReceipt.phone && {
              phone: finalReceipt.phone.startsWith('+') 
                ? finalReceipt.phone 
                : finalReceipt.phone.replace(/\D/g, '').startsWith('7')
                ? `+${finalReceipt.phone.replace(/\D/g, '')}`
                : finalReceipt.phone.replace(/\D/g, '').startsWith('8')
                ? `+7${finalReceipt.phone.replace(/\D/g, '').slice(1)}`
                : `+7${finalReceipt.phone.replace(/\D/g, '')}`
            })
          },
          items: [
            {
              description: type === 'balance_topup' 
                ? 'Пополнение баланса'
                : type === 'promotion' && metadata?.promotion_id === 'two_courses'
                ? 'Оплата 2 курсов по акции'
                : type === 'promotion' && metadata?.promotion_id === 'first_100'
                ? 'Оплата курса по акции "Первым 1000 студентам"'
                : type === 'final_modules'
                ? 'Оплата финальных модулей курса'
                : 'Оплата курса',
              quantity: '1.00',
              amount: {
                value: (amount / 100).toFixed(2),
                currency: 'RUB'
              },
              vat_code: 1, // Без НДС (для образовательных услуг)
              payment_mode: 'full_prepayment',
              payment_subject: 'educational_services'
            }
          ],
          send: true // Автоматическая отправка чека покупателю
        }
      }),
      metadata: {
        ...(courseId && { course_id: courseId }),
        user_id: userId || 'guest',
        payment_method: paymentMethod || 'card',
        type: type || 'course_purchase',
        ...(promocode && {
          promocode_id: promocode.id,
          promocode_code: promocode.code,
          promocode_discount_percent: promocode.discountPercent || null,
          promocode_discount_amount: promocode.discountAmount || null
        }),
        ...(body.metadata || {})
      }
    }

    // Для всех методов оплаты используем payment_method_types
    // Это более универсальный подход, который работает для всех методов
    paymentData.payment_method_types = [paymentMethodType]

    // Логируем данные платежа для отладки (без секретных данных)
    console.log('📤 Создание платежа в ЮКасса:', {
      amount: paymentData.amount,
      description: paymentData.description,
      hasReceipt: !!(finalReceipt && (finalReceipt.email || finalReceipt.phone)),
      receipt: finalReceipt && (finalReceipt.email || finalReceipt.phone) ? {
        hasEmail: !!finalReceipt.email,
        hasPhone: !!finalReceipt.phone
      } : null,
      paymentMethod: paymentMethodType,
      metadata: paymentData.metadata
    })

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotencyKey,
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Ошибка ЮКасса:', JSON.stringify(errorData, null, 2))
      console.error('❌ Отправленные данные (без секретов):', JSON.stringify({
        amount: paymentData.amount,
        description: paymentData.description,
        receipt: paymentData.receipt,
        metadata: paymentData.metadata
      }, null, 2))
      return NextResponse.json(
        { 
          error: errorData.description || errorData.message || 'Ошибка создания платежа',
          details: errorData,
          code: errorData.code
        },
        { status: response.status }
      )
    }

    const payment: YooKassaPayment = await response.json()

    // Сохраняем платеж в БД
    // Используем createAdminClient чтобы гарантировать сохранение (обход RLS)
    if (userId) {
      const supabase = createAdminClient()
      
      if (!supabase) {
        console.error('❌ Не удалось создать admin client для сохранения платежа')
        // Продолжаем - webhook создаст платеж
      } else {
        // Определяем полный доступ: если это покупка курса (не модуля) и цена = полной цене курса
        let isFullAccess = false
        if (courseId && type === 'course_purchase') {
          // Получаем цену курса из БД
          const { data: courseData } = await supabase
            .from('courses')
            .select('price')
            .eq('id', courseId)
            .single()
        
          // Если цена совпадает с полной ценой курса - это полный доступ
          // Или если в metadata явно указано is_full_access
          const paymentMetadata = metadata || {}
          isFullAccess = paymentMetadata.is_full_access === true || 
                        (courseData ? amount >= courseData.price : false)
        }
        
        console.log('💾 Сохраняем платеж в БД...', {
          userId,
          courseId,
          amount,
          yookassaPaymentId: payment.id
        })
        
        // Маппим методы оплаты на допустимые значения для БД
        // ВАЖНО: Если метод 'sbp', используем 'card' как fallback из-за constraint
        const rawPaymentMethod = paymentMethod || 'card'
        // Используем 'card' для БД если метод не в списке разрешенных или если это sbp
        const dbPaymentMethod = ['card', 'sbp', 'sber_pay', 'yoomoney'].includes(rawPaymentMethod) 
          ? (rawPaymentMethod === 'sbp' ? 'card' : rawPaymentMethod) // sbp -> card для БД
          : 'card'
        
        const promotionId = metadata?.promotion_id
        const paymentType = type || 'course_purchase'
        
        const { data: insertedPayment, error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          ...(courseId && { course_id: courseId }),
          amount: amount,
          currency: 'RUB',
          payment_method: dbPaymentMethod, // Используем card для sbp
          status: 'pending',
          is_full_access: isFullAccess,
          metadata: {
            yookassa_payment_id: payment.id,
            confirmation_url: payment.confirmation.confirmation_url,
            type: paymentType,
            original_payment_method: rawPaymentMethod, // Сохраняем оригинальный метод (sbp) в metadata
            ...(promotionId && { promotion_id: promotionId }),
            // Сохраняем email/phone из receipt для истории
            ...(finalReceipt && (finalReceipt.email || finalReceipt.phone) && {
              receipt: {
                ...(finalReceipt.email && { email: finalReceipt.email }),
                ...(finalReceipt.phone && { phone: finalReceipt.phone })
              }
            }),
            ...(metadata || {})
          }
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ ОШИБКА сохранения платежа в БД:', insertError)
        console.error('Детали ошибки:', JSON.stringify(insertError, null, 2))
        console.error('Код ошибки:', insertError.code)
        console.error('Сообщение:', insertError.message)
        console.error('Детали:', insertError.details)
        console.error('Подсказка:', insertError.hint)
        
        // Не прерываем процесс, так как платеж уже создан в YooKassa
        // Webhook все равно придет и создаст запись
      } else {
          console.log('✅ Платеж успешно сохранен в БД:', insertedPayment.id)
          console.log('📋 Данные сохраненного платежа:', {
            id: insertedPayment.id,
            user_id: insertedPayment.user_id,
            course_id: insertedPayment.course_id,
            amount: insertedPayment.amount,
            status: insertedPayment.status,
            metadata: insertedPayment.metadata
          })
        }
      }
    } else {
      console.warn('⚠️ userId отсутствует, платеж не сохранен в БД (ожидаем webhook)')
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
      status: payment.status
    })

  } catch (error: any) {
    console.error('Ошибка создания платежа:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

