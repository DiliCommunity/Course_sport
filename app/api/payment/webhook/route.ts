import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface YooKassaWebhook {
  type: string
  event: string
  object: {
    id: string
    status: string
    amount: {
      value: string
      currency: string
    }
    description?: string
    metadata?: {
      course_id?: string
      user_id?: string
    }
    payment_method?: {
      type: string
      id: string
    }
    created_at: string
    captured_at?: string
    paid?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: YooKassaWebhook = await request.json()
    
    console.log('YooKassa webhook received:', body.event, body.object?.id)
    
    const { event, object: payment } = body
    
    if (!payment || !payment.id) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Обрабатываем различные события
    switch (event) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(supabase, payment)
        break
        
      case 'payment.canceled':
        await handlePaymentCanceled(supabase, payment)
        break
        
      case 'payment.waiting_for_capture':
        // Ожидает подтверждения (для двухстадийных платежей)
        await updatePaymentStatus(supabase, payment.id, 'processing')
        break
        
      case 'refund.succeeded':
        await handleRefundSucceeded(supabase, payment)
        break
        
      default:
        console.log('Unhandled webhook event:', event)
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Обработка успешного платежа
async function handlePaymentSucceeded(supabase: any, payment: YooKassaWebhook['object']) {
  const courseId = payment.metadata?.course_id
  
  // Обновляем статус платежа
  const { data: paymentData } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: {
        yookassa_id: payment.id,
        payment_method: payment.payment_method?.type,
        captured_at: payment.captured_at
      }
    })
    .eq('metadata->>yookassa_id', payment.id)
    .select('user_id, course_id')
    .single()

  // Если платёж найден, создаём enrollment
  if (paymentData && paymentData.user_id && courseId) {
    // Записываем пользователя на курс
    await supabase.from('enrollments').upsert({
      user_id: paymentData.user_id,
      course_id: courseId,
      progress: 0
    }, {
      onConflict: 'user_id,course_id'
    })
    
    console.log(`User ${paymentData.user_id} enrolled in course ${courseId}`)
  }
}

// Обработка отменённого платежа
async function handlePaymentCanceled(supabase: any, payment: YooKassaWebhook['object']) {
  await updatePaymentStatus(supabase, payment.id, 'failed')
}

// Обработка возврата
async function handleRefundSucceeded(supabase: any, payment: YooKassaWebhook['object']) {
  await updatePaymentStatus(supabase, payment.id, 'refunded')
  
  // Можно также отменить enrollment
  // Но обычно оставляем доступ до истечения срока
}

// Обновление статуса платежа
async function updatePaymentStatus(supabase: any, yookassaId: string, status: string) {
  await supabase
    .from('payments')
    .update({ status })
    .eq('metadata->>yookassa_id', yookassaId)
}

