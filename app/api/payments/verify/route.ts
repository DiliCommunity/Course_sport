import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const courseId = searchParams.get('course_id')
    const userId = searchParams.get('user_id')

    console.log('🔍 Payment verify request:', { paymentId, courseId, userId })

    if (!paymentId && !courseId) {
      console.error('❌ No payment_id or course_id provided')
      return NextResponse.json(
        { error: 'Payment ID or Course ID required' },
        { status: 400 }
      )
    }

    // Если есть payment_id (ID от ЮКассы), можем проверить без авторизации
    // Используем admin client для обхода RLS
    const adminSupabase = createAdminClient()
    
    if (!adminSupabase) {
      console.error('❌ Admin client not available')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Пытаемся получить пользователя (необязательно)
    const supabase = await createClient()
    let user = null
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }

    console.log('👤 User auth status:', { hasUser: !!user, userId: user?.id })

    // Ищем платеж
    let query = adminSupabase
      .from('payments')
      .select('id, status, course_id, amount, metadata, created_at, completed_at, user_id')
      .order('created_at', { ascending: false })

    if (paymentId) {
      // Ищем по yookassa_payment_id в metadata (можно без user_id)
      console.log('🔍 Searching by payment_id:', paymentId)
      query = query.filter('metadata->>yookassa_payment_id', 'eq', paymentId) as any
    } else if (courseId) {
      // Для проверки по course_id нужен user_id
      if (!user) {
        console.error('❌ No user for course_id check')
        return NextResponse.json(
          { error: 'Unauthorized - user required for course_id check' },
          { status: 401 }
        )
      }
      // Ищем последний платеж по курсу (конвертируем ID если нужно)
      const { getCourseUUID } = await import('@/lib/constants')
      const courseUUID = courseId.includes('-') ? courseId : getCourseUUID(courseId)
      console.log('🔍 Searching by course_id:', courseUUID, 'for user:', user.id)
      query = query.eq('course_id', courseUUID).eq('user_id', user.id) as any
    }
    
    query = query.limit(1) as any

    const { data: payment, error } = await query.maybeSingle()

    console.log('💳 Payment query result:', { 
      found: !!payment, 
      status: payment?.status,
      error: error?.message 
    })

    if (error) {
      console.error('❌ Error fetching payment:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    if (!payment) {
      console.log('⚠️ Payment not found')
      return NextResponse.json(
        { 
          verified: false,
          status: 'not_found',
          message: 'Платеж не найден'
        },
        { status: 200 }
      )
    }

    // Если проверяли по payment_id, но user_id не совпадает - это может быть проблема безопасности
    // Но для проверки статуса платежа это допустимо
    if (paymentId && user && payment.user_id !== user.id) {
      console.warn('⚠️ Payment user_id mismatch:', { 
        paymentUserId: payment.user_id, 
        currentUserId: user.id 
      })
      // Продолжаем - это просто проверка статуса
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

