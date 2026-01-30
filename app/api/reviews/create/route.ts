import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Получаем пользователя из сессии (поддерживает и cookie, и X-Session-Token header для VK Mini App)
    const user = await getUserFromSession(supabase)
    
    // Используем admin клиент для всех операций с БД (обход RLS)
    const adminSupabase = createAdminClient()
    
    if (!adminSupabase) {
      console.error('[Review Create] Admin client not available')
      return NextResponse.json(
        { error: 'Ошибка сервера' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const userId = user.id

    const body = await request.json()
    const { courseId, courseName, rating, text, isAnonymous } = body

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

    // Проверяем, что пользователь купил именно этот курс (если не админ)
    const isAdmin = user.is_admin === true
    if (!isAdmin) {
      // Проверяем наличие завершенной оплаты для этого курса
      const { data: payments, error: paymentError } = await adminSupabase
        .from('payments')
        .select('id, status, course_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'completed')
        .limit(1)

      console.log('[Review Create] Payment check for course:', courseId, 'Found:', payments?.length || 0, 'Error:', paymentError?.message)

      let hasAccess = false

      // Если есть оплата - доступ есть
      if (payments && payments.length > 0) {
        hasAccess = true
      } else {
        // Если нет оплаты, проверяем enrollments
        const { data: enrollments, error: enrollmentError } = await adminSupabase
          .from('enrollments')
          .select('id, course_id')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .limit(1)

        console.log('[Review Create] Enrollment check for course:', courseId, 'Found:', enrollments?.length || 0, 'Error:', enrollmentError?.message)

        if (enrollments && enrollments.length > 0) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Вы можете оставить отзыв только по купленному вами курсу' },
          { status: 403 }
        )
      }
    }

    // Проверяем, не оставлял ли пользователь уже отзыв на этот курс
    const { data: existingReview, error: checkError } = await adminSupabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (checkError) {
      console.error('[Review Create] Error checking existing review:', checkError)
    }

    if (existingReview) {
      // Обновляем существующий отзыв
      const displayName = isAnonymous ? 'Анонимный пользователь' : (user.name || user.username || 'Пользователь')
      const { data: updatedReview, error: updateError } = await adminSupabase
        .from('reviews')
        .update({
          course_name: courseName,
          rating,
          text: text.trim(),
          user_name: displayName,
          is_anonymous: isAnonymous === true,
          is_approved: false, // Требуется повторная модерация
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single()

      if (updateError) {
        console.error('[Review Create] Error updating review:', updateError)
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
      const displayName = isAnonymous ? 'Анонимный пользователь' : (user.name || user.username || 'Пользователь')
      const { data: newReview, error: insertError } = await adminSupabase
        .from('reviews')
        .insert({
          user_id: userId,
          course_id: courseId,
          course_name: courseName,
          rating,
          text: text.trim(),
          user_name: displayName,
          is_anonymous: isAnonymous === true,
          is_verified: true, // Пользователь авторизован, значит верифицирован
          is_approved: false // Требуется модерация
        })
        .select()
        .single()

      if (insertError) {
        console.error('[Review Create] Error creating review:', insertError)
        return NextResponse.json(
          { error: `Ошибка при создании отзыва: ${insertError.message}` },
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

