import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
      course_id: string
      user_id: string
      payment_method: string
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

    const supabase = await createClient()

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
  const courseId = metadata?.course_id
  const userId = metadata?.user_id

  if (!courseId || !userId || userId === 'guest') {
    console.log('Нет данных для записи на курс:', { courseId, userId })
    return
  }

  // Обновляем статус платежа
  await supabase
    .from('payments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        yookassa_payment_id: payment.id,
        paid: payment.paid
      }
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'pending')

  // Создаем запись о зачислении на курс
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .upsert({
      user_id: userId,
      course_id: courseId,
      progress: 0,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,course_id'
    })

  if (enrollmentError) {
    console.error('Ошибка создания записи на курс:', enrollmentError)
  } else {
    console.log(`Пользователь ${userId} записан на курс ${courseId}`)
  }

  // Создаем транзакцию
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'spent',
    amount: Math.round(parseFloat(payment.amount.value) * 100), // В копейках
    description: `Оплата курса: ${payment.description}`,
    reference_id: courseId,
    reference_type: 'course_purchase'
  })
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

