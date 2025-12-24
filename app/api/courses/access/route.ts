import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Проверка доступа к модулю/уроку курса
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const moduleNumber = searchParams.get('module_number')
    const lessonId = searchParams.get('lesson_id')

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      )
    }

    // Получаем текущего пользователя
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем профиль пользователя
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin, username')
      .eq('id', user.id)
      .single()

    // Проверяем, является ли пользователь админом
    const isAdmin = profile?.is_admin === true || profile?.username === 'admini_mini'

    // Если админ - полный доступ
    if (isAdmin) {
      return NextResponse.json({
        hasAccess: true,
        isAdmin: true,
        reason: 'admin_access',
      })
    }

    // Проверяем, записан ли пользователь на курс
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (!enrollment) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'not_enrolled',
        message: 'Вы не записаны на этот курс',
      })
    }

    // Если проверяем доступ к конкретному модулю
    if (moduleNumber) {
      const moduleNum = parseInt(moduleNumber)
      
      // Модуль 1 (бесплатный) - всегда доступен
      if (moduleNum === 1) {
        return NextResponse.json({
          hasAccess: true,
          reason: 'free_module',
        })
      }

      // Для модулей 2+ проверяем, пройден ли предыдущий модуль
      // Предполагаем, что модуль 2 начинается после 7 уроков (для кето) или 5 уроков (для интервального)
      const previousModuleLessons = moduleNum === 2 ? (courseId === '1' ? 7 : 5) : (moduleNum - 1) * 10
      
      // Получаем прогресс по урокам
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('completed', true)

      const completedLessons = lessonProgress?.length || 0

      // Проверяем, пройден ли предыдущий модуль (минимум 80% уроков)
      const requiredLessons = Math.floor(previousModuleLessons * 0.8)
      
      if (completedLessons < requiredLessons) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'previous_module_not_completed',
          message: `Сначала завершите модуль ${moduleNum - 1}`,
          completedLessons,
          requiredLessons,
        })
      }
    }

    // Если проверяем доступ к конкретному уроку
    if (lessonId) {
      // Получаем информацию об уроке
      const { data: lesson } = await supabase
        .from('lessons')
        .select('order_index, is_free, course_id')
        .eq('id', lessonId)
        .single()

      if (!lesson) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'lesson_not_found',
        })
      }

      // Бесплатные уроки всегда доступны
      if (lesson.is_free) {
        return NextResponse.json({
          hasAccess: true,
          reason: 'free_lesson',
        })
      }

      // Проверяем, пройдены ли предыдущие уроки
      const { data: previousLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .lt('order_index', lesson.order_index)
        .order('order_index', { ascending: true })

      if (previousLessons && previousLessons.length > 0) {
        const { data: completedPrevious } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .in('lesson_id', previousLessons.map(l => l.id))
          .eq('completed', true)

        const completedCount = completedPrevious?.length || 0
        const requiredCount = previousLessons.length

        if (completedCount < requiredCount) {
          return NextResponse.json({
            hasAccess: false,
            reason: 'previous_lessons_not_completed',
            message: 'Сначала завершите предыдущие уроки',
            completedCount,
            requiredCount,
          })
        }
      }
    }

    return NextResponse.json({
      hasAccess: true,
      reason: 'enrolled',
    })
  } catch (error: any) {
    console.error('Access check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

