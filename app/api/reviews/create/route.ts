import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
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
        { error: 'Недействительная сессия' },
        { status: 401 }
      )
    }

    const userId = session.user_id

    // Получаем данные пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, username')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
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

