import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * API для получения списка купленных курсов пользователя
 * Используется для формы отзыва - показывает только те курсы, на которые пользователь записан
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем записи на курсы (enrollments) - это означает, что курс куплен
    const { data: enrollments, error: enrollmentsError } = await adminSupabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)

    if (enrollmentsError) {
      console.error('[Purchased Courses API] Error fetching enrollments:', enrollmentsError)
      return NextResponse.json(
        { error: 'Ошибка получения курсов' },
        { status: 500 }
      )
    }

    // Получаем уникальные ID курсов
    const courseIds = Array.from(new Set((enrollments || []).map(e => e.course_id).filter(Boolean)))

    if (courseIds.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    // Получаем информацию о курсах
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, slug')
      .in('id', courseIds)
      .order('title')

    if (coursesError) {
      console.error('[Purchased Courses API] Error fetching courses:', coursesError)
      return NextResponse.json(
        { error: 'Ошибка получения информации о курсах' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      courses: courses || []
    })

  } catch (error: any) {
    console.error('[Purchased Courses API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

