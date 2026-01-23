import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Получаем пользователя из сессии (поддерживает и cookie, и X-Session-Token header для VK Mini App)
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Проверяем, может ли пользователь писать отзывы
    // Отзывы могут писать только те, кто совершил хотя бы 1 оплату или является админом
    const isAdmin = user.is_admin === true || false
    
    if (!isAdmin) {
      const adminSupabase = createAdminClient()
      
      if (!adminSupabase) {
        console.error('[Review Create] Admin client not available')
        return NextResponse.json(
          { error: 'Ошибка сервера при проверке прав доступа' },
          { status: 500 }
        )
      }

      // Проверяем наличие хотя бы одной завершенной оплаты (используем adminSupabase для обхода RLS)
      const { data: payments, error: paymentsError } = await adminSupabase
        .from('payments')
        .select('id, status, course_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .limit(10)

      console.log('[Review Create] Payments found:', payments?.length || 0, 'Error:', paymentsError?.message)

      if (paymentsError) {
        console.error('[Review Create] Error checking payments:', paymentsError)
        return NextResponse.json(
          { error: 'Ошибка при проверке прав доступа' },
          { status: 500 }
        )
      }

      // Если нет оплат, проверяем enrollments
      if (!payments || payments.length === 0) {
        const { data: enrollments, error: enrollmentsError } = await adminSupabase
          .from('enrollments')
          .select('id, course_id')
          .eq('user_id', userId)
          .limit(10)

        console.log('[Review Create] Enrollments found:', enrollments?.length || 0, 'Error:', enrollmentsError?.message)

        if (enrollmentsError) {
          console.error('[Review Create] Error checking enrollments:', enrollmentsError)
          return NextResponse.json(
            { error: 'Ошибка при проверке прав доступа' },
            { status: 500 }
          )
        }

        if (!enrollments || enrollments.length === 0) {
          return NextResponse.json(
            { error: 'Вы можете оставить отзыв только после покупки хотя бы одного курса' },
            { status: 403 }
          )
        }
      }
    }

    const body = await request.json()
    const { courseId, courseName, rating, text } = body

    // Валидация
    if (!courseId || !courseName || !rating || !text) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Оценка должна быть от 1 до 5' },
        { status: 400 }
      )
    }

    if (text.length < 10) {
      return NextResponse.json(
        { error: 'Текст отзыва должен содержать минимум 10 символов' },
        { status: 400 }
      )
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'Текст отзыва не должен превышать 2000 символов' },
        { status: 400 }
      )
    }

    // Проверяем, не оставлял ли пользователь уже отзыв на этот курс
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing review:', checkError)
    }

    if (existingReview) {
      // Обновляем существующий отзыв
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({
          course_name: courseName,
          rating,
          text: text.trim(),
          user_name: user.name || user.username || 'Пользователь',
          is_approved: false, // Требуется повторная модерация
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating review:', updateError)
        return NextResponse.json(
          { error: 'Ошибка при обновлении отзыва' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Отзыв обновлён и отправлен на модерацию',
        review: updatedReview
      })
    } else {
      // Создаём новый отзыв
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          course_id: courseId,
          course_name: courseName,
          rating,
          text: text.trim(),
          user_name: user.name || user.username || 'Пользователь',
          is_verified: true, // Пользователь авторизован, значит верифицирован
          is_approved: false // Требуется модерация
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating review:', insertError)
        return NextResponse.json(
          { error: 'Ошибка при создании отзыва' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Отзыв отправлен на модерацию',
        review: newReview
      })
    }
  } catch (error: any) {
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

