import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCourseUUID } from '@/lib/constants'

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
    const { courseId: rawCourseId, paymentMethod, amount, userId, returnUrl, type } = body
    
    // Конвертируем старые ID ('1', '2') в UUID для БД
    const courseId = rawCourseId ? getCourseUUID(rawCourseId) : null
    
    console.log('=== PAYMENT CREATE ===')
    console.log('Raw courseId:', rawCourseId)
    console.log('UUID courseId:', courseId)
    console.log('userId:', userId)
    console.log('amount:', amount)

    // Проверяем обязательные параметры
    if (type === 'balance_topup') {
      // Для пополнения баланса нужна только сумма
      if (!amount || amount < 10000) { // Минимум 100₽ в копейках
        return NextResponse.json(
          { error: 'Минимальная сумма пополнения: 100₽' },
          { status: 400 }
        )
      }
    } else {
      // Для покупки курса нужны курс и сумма
      if (!courseId || !amount) {
        return NextResponse.json(
          { error: 'Не указан курс или сумма' },
          { status: 400 }
        )
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
    const getPaymentMethodData = (method: string) => {
      switch (method) {
        case 'sbp':
          return { type: 'sbp' }
        case 'sber_pay':
          return { type: 'sberbank' }
        case 'tinkoff_pay':
          return { type: 'tinkoff_bank' }
        case 'yoomoney':
          return { type: 'yoo_money' }
        case 'card':
        default:
          return { type: 'bank_card' }
      }
    }

    // Создаем платеж в ЮКасса
    const paymentData = {
      amount: {
        value: (amount / 100).toFixed(2), // Конвертируем копейки в рубли
        currency: 'RUB'
      },
      capture: true, // Автоматическое подтверждение
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?course=${courseId}`
      },
      description: type === 'balance_topup' 
        ? `Пополнение баланса на ${(amount / 100).toFixed(2)}₽`
        : `Оплата курса #${courseId}`,
      metadata: {
        ...(courseId && { course_id: courseId }),
        user_id: userId || 'guest',
        payment_method: paymentMethod || 'card',
        type: type || 'course_purchase'
      },
      payment_method_data: getPaymentMethodData(paymentMethod || 'card')
    }

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
      console.error('Ошибка ЮКасса:', errorData)
      return NextResponse.json(
        { error: errorData.description || 'Ошибка создания платежа' },
        { status: response.status }
      )
    }

    const payment: YooKassaPayment = await response.json()

    // Сохраняем платеж в БД
    if (userId) {
      const supabase = await createClient()
      await supabase.from('payments').insert({
        user_id: userId,
        ...(courseId && { course_id: courseId }),
        amount: amount,
        currency: 'RUB',
        payment_method: paymentMethod || 'card',
        status: 'pending',
        metadata: {
          yookassa_payment_id: payment.id,
          confirmation_url: payment.confirmation.confirmation_url,
          type: type || 'course_purchase'
        }
      })
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

