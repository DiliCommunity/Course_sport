import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { canReview: false, reason: 'not_authenticated' },
        { status: 200 }
      )
    }

    if (!adminSupabase) {
      console.error('[Review Permission] Admin client not available')
      return NextResponse.json(
        { canReview: false, reason: 'server_error' },
        { status: 200 }
      )
    }

    // Получаем пользователя по сессии
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      console.error('[Review Permission] Session error:', sessionError)
      return NextResponse.json(
        { canReview: false, reason: 'invalid_session' },
        { status: 200 }
      )
    }

    const userId = session.user_id
    console.log('[Review Permission] Checking for user:', userId)

    // Получаем данные пользователя (используем adminSupabase для обхода RLS)
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('[Review Permission] User not found:', userError)
      return NextResponse.json(
        { canReview: false, reason: 'user_not_found' },
        { status: 200 }
      )
    }

    // Проверяем, является ли пользователь админом
    const isAdmin = user.is_admin === true

    if (isAdmin) {
      console.log('[Review Permission] User is admin')
      return NextResponse.json({
        canReview: true,
        reason: 'admin'
      })
    }

    // Проверяем наличие хотя бы одной завершенной оплаты (используем adminSupabase)
    const { data: payments, error: paymentsError } = await adminSupabase
      .from('payments')
      .select('id, status, course_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(10)

    console.log('[Review Permission] Payments found:', payments?.length || 0, 'Error:', paymentsError?.message)

    if (paymentsError) {
      console.error('[Review Permission] Error checking payments:', paymentsError)
      return NextResponse.json(
        { canReview: false, reason: 'database_error' },
        { status: 200 }
      )
    }

    // Если есть оплаты - разрешаем
    if (payments && payments.length > 0) {
      console.log('[Review Permission] User has payments, allowing review')
      return NextResponse.json({
        canReview: true,
        reason: 'has_payment'
      })
    }

    // Если нет оплат, проверяем enrollments (используем adminSupabase)
    const { data: enrollments, error: enrollmentsError } = await adminSupabase
      .from('enrollments')
      .select('id, course_id')
      .eq('user_id', userId)
      .limit(10)

    console.log('[Review Permission] Enrollments found:', enrollments?.length || 0, 'Error:', enrollmentsError?.message)

    if (enrollmentsError) {
      console.error('[Review Permission] Error checking enrollments:', enrollmentsError)
      return NextResponse.json(
        { canReview: false, reason: 'database_error' },
        { status: 200 }
      )
    }

    if (enrollments && enrollments.length > 0) {
      console.log('[Review Permission] User has enrollments, allowing review')
      return NextResponse.json({
        canReview: true,
        reason: 'has_enrollment'
      })
    }

    // Нет ни оплат, ни enrollments, ни прав админа
    console.log('[Review Permission] No payments or enrollments found, denying review')
    return NextResponse.json({
      canReview: false,
      reason: 'no_payment'
    })
  } catch (error: any) {
    console.error('Review permission check error:', error)
    return NextResponse.json(
      { canReview: false, reason: 'server_error' },
      { status: 200 }
    )
  }
}

