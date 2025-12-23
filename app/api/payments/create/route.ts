import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { courseId, paymentMethod, amount, userId, returnUrl } = body

    // Проверяем обязательные параметры
    if (!courseId || !amount) {
      return NextResponse.json(
        { error: 'Не указан курс или сумма' },
        { status: 400 }
      )
    }

    // Получаем данные ЮКасса из env
    const shopId = process.env.YOOKASSA_SHOP_ID
    const secretKey = process.env.YOOKASSA_SECRET_KEY

    if (!shopId || !secretKey) {
      console.error('ЮКасса не настроена: отсутствуют YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY')
      return NextResponse.json(
        { error: 'Платежная система не настроена' },
        { status: 500 }
      )
    }

    // Генерируем уникальный idempotency key
    const idempotencyKey = `${courseId}-${userId || 'guest'}-${Date.now()}`

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
      description: `Оплата курса #${courseId}`,
      metadata: {
        course_id: courseId,
        user_id: userId || 'guest',
        payment_method: paymentMethod || 'card'
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
        course_id: courseId,
        amount: amount,
        currency: 'RUB',
        payment_method: paymentMethod || 'card',
        status: 'pending',
        metadata: {
          yookassa_payment_id: payment.id,
          confirmation_url: payment.confirmation.confirmation_url
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

