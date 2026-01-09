import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const courseId = searchParams.get('course_id')
    const userId = searchParams.get('user_id')

    if (!paymentId && !courseId) {
      return NextResponse.json(
        { error: 'Payment ID or Course ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ищем платеж
    let query = supabase
      .from('payments')
      .select('id, status, course_id, amount, metadata, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (paymentId) {
      // Ищем по yookassa_payment_id в metadata
      query = query.filter('metadata->>yookassa_payment_id', 'eq', paymentId) as any
    } else if (courseId) {
      // Ищем последний платеж по курсу (конвертируем ID если нужно)
      const { getCourseUUID } = await import('@/lib/constants')
      const courseUUID = courseId.includes('-') ? courseId : getCourseUUID(courseId)
      query = query.eq('course_id', courseUUID) as any
    }
    
    query = query.limit(1) as any

    const { data: payment, error } = await query.maybeSingle()

    if (error) {
      console.error('Error fetching payment:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!payment) {
      return NextResponse.json(
        { 
          verified: false,
          status: 'not_found',
          message: 'Платеж не найден'
        },
        { status: 200 }
      )
    }

    // Проверяем статус
    const isCompleted = payment.status === 'completed'
    const isPending = payment.status === 'pending'
    const isFailed = payment.status === 'failed' || payment.status === 'canceled'

    return NextResponse.json({
      verified: isCompleted,
      status: payment.status,
      paymentId: payment.id,
      courseId: payment.course_id,
      amount: payment.amount,
      completedAt: payment.completed_at,
      message: isCompleted 
        ? 'Платеж успешно обработан'
        : isPending
        ? 'Платеж обрабатывается'
        : 'Платеж не прошел'
    })

  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

