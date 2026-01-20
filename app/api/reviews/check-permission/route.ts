import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { canReview: false, reason: 'not_authenticated' },
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
      return NextResponse.json(
        { canReview: false, reason: 'invalid_session' },
        { status: 200 }
      )
    }

    const userId = session.user_id

    // Получаем данные пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { canReview: false, reason: 'user_not_found' },
        { status: 200 }
      )
    }

    // Проверяем, является ли пользователь админом
    const isAdmin = user.is_admin === true

    if (isAdmin) {
      return NextResponse.json({
        canReview: true,
        reason: 'admin'
      })
    }

    // Проверяем наличие хотя бы одной завершенной оплаты
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(1)

    if (paymentsError) {
      console.error('Error checking payments:', paymentsError)
      return NextResponse.json(
        { canReview: false, reason: 'database_error' },
        { status: 200 }
      )
    }

    // Если есть оплаты - разрешаем
    if (payments && payments.length > 0) {
      return NextResponse.json({
        canReview: true,
        reason: 'has_payment'
      })
    }

    // Если нет оплат, проверяем enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (enrollmentsError) {
      console.error('Error checking enrollments:', enrollmentsError)
      return NextResponse.json(
        { canReview: false, reason: 'database_error' },
        { status: 200 }
      )
    }

    if (enrollments && enrollments.length > 0) {
      return NextResponse.json({
        canReview: true,
        reason: 'has_enrollment'
      })
    }

    // Нет ни оплат, ни enrollments, ни прав админа
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

