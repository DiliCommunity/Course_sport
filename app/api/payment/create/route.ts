import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

// Типы платежных методов ЮKassa
type PaymentMethodType = 
  | 'bank_card' 
  | 'sbp' 
  | 'sberbank' 
  | 'tinkoff_bank' 
  | 'yoo_money' 
  | 'mir_pay'

interface CreatePaymentRequest {
  courseId: string
  amount: number
  currency?: string
  paymentMethod: PaymentMethodType
  description: string
  returnUrl: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json()
    const { courseId, amount, currency = 'RUB', paymentMethod, description, returnUrl } = body

    // Валидация
    if (!courseId || !amount || !description || !returnUrl) {
      return NextResponse.json(
        { error: 'Не указаны обязательные параметры' },
        { status: 400 }
      )
    }

    // Минимальная сумма ЮKassa - 10 рублей
    if (amount < 10) {
      return NextResponse.json(
        { error: 'Минимальная сумма оплаты - 10₽' },
        { status: 400 }
      )
    }

    // Получаем ключи ЮKassa из env
    const shopId = process.env.YOOKASSA_SHOP_ID
    const secretKey = process.env.YOOKASSA_SECRET_KEY

    if (!shopId || !secretKey) {
      console.error('YooKassa credentials not configured')
      return NextResponse.json(
        { error: 'Платёжная система не настроена' },
        { status: 500 }
      )
    }

    // Создаём идемпотентный ключ
    const idempotenceKey = uuidv4()

    // Формируем запрос к ЮKassa API
    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: currency
      },
      capture: true, // Автоматическое подтверждение платежа
      confirmation: {
        type: 'redirect',
        return_url: returnUrl
      },
      description: description,
      metadata: {
        course_id: courseId
      },
      payment_method_data: getPaymentMethodData(paymentMethod)
    }

    // Отправляем запрос к ЮKassa
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')
      },
      body: JSON.stringify(paymentData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('YooKassa API error:', result)
      return NextResponse.json(
        { error: result.description || 'Ошибка создания платежа' },
        { status: response.status }
      )
    }

    // Сохраняем платёж в БД
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase.from('payments').insert({
          user_id: user.id,
          course_id: courseId,
          amount: amount * 100, // Храним в копейках
          currency: currency,
          payment_method: paymentMethod,
          status: 'pending',
          metadata: {
            yookassa_id: result.id,
            idempotence_key: idempotenceKey
          }
        })
      }
    } catch (dbError) {
      console.error('DB error saving payment:', dbError)
      // Не прерываем процесс - платёж уже создан в ЮKassa
    }

    return NextResponse.json({
      success: true,
      paymentId: result.id,
      confirmationUrl: result.confirmation?.confirmation_url,
      status: result.status
    })

  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Формируем данные метода оплаты
function getPaymentMethodData(method: PaymentMethodType) {
  switch (method) {
    case 'sbp':
      return { type: 'sbp' }
    case 'sberbank':
      return { type: 'sberbank' }
    case 'tinkoff_bank':
      return { type: 'tinkoff_bank' }
    case 'yoo_money':
      return { type: 'yoo_money' }
    case 'mir_pay':
      return { type: 'mir_pay' }
    case 'bank_card':
    default:
      return { type: 'bank_card' }
  }
}

