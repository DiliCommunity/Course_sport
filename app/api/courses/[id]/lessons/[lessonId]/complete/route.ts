import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { COURSE_IDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, lessonId: string } }
) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const courseId = params.id
    const lessonId = params.lessonId

    // Проверяем, является ли это статическим уроком (модули 2-4)
    // Статические уроки имеют ID вида: keto-m2-l1, if-m3-l2 и т.д.
    const isStaticLesson = lessonId.startsWith('keto-m') || lessonId.startsWith('if-m')
    
    // Проверяем соответствие урока курсу
    if (isStaticLesson) {
      // Для статических уроков проверяем префикс
      const isKetoCourse = courseId === COURSE_IDS.KETO || courseId === '1' || courseId === '00000000-0000-0000-0000-000000000001'
      const isIntervalCourse = courseId === COURSE_IDS.INTERVAL || courseId === '2' || courseId === '00000000-0000-0000-0000-000000000002'
      
      const isKetoLesson = lessonId.startsWith('keto-m')
      const isIntervalLesson = lessonId.startsWith('if-m')
      
      // Проверяем соответствие: кето урок должен быть в кето курсе, IF урок - в IF курсе
      if ((isKetoLesson && !isKetoCourse) || (isIntervalLesson && !isIntervalCourse)) {
        return NextResponse.json(
          { error: 'Lesson does not belong to this course' },
          { status: 400 }
        )
      }
    } else {
      // Для обычных уроков проверяем наличие в БД и соответствие курсу
      const { data: lesson } = await adminSupabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .single()

      if (!lesson) {
        return NextResponse.json(
          { error: 'Lesson not found or does not belong to this course' },
          { status: 404 }
        )
      }
    }

    // Проверяем, не завершен ли уже урок
    const { data: existingProgress } = await adminSupabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (!existingProgress) {
      // Создаем запись о прогрессе
      const { error: progressError } = await adminSupabase
        .from('lesson_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true
        })

      if (progressError) {
        console.error('Error creating lesson progress:', progressError)
        return NextResponse.json(
          { error: 'Failed to mark lesson as complete' },
          { status: 500 }
        )
      }
    } else {
      // Обновляем существующую запись
      const { error: updateError } = await adminSupabase
        .from('lesson_progress')
        .update({
          completed: true
        })
        .eq('id', existingProgress.id)

      if (updateError) {
        console.error('Error updating lesson progress:', updateError)
        return NextResponse.json(
          { error: 'Failed to mark lesson as complete' },
          { status: 500 }
        )
      }
    }

    // Обновляем общий прогресс в enrollment
    // Для статических уроков фильтруем по префиксу lesson_id
    let completedLessonsQuery = adminSupabase
      .from('lesson_progress')
      .select('lesson_id', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .eq('completed', true)
    
    if (isStaticLesson) {
      // Для статических уроков фильтруем по префиксу
      const prefix = courseId === COURSE_IDS.KETO || courseId === '1' || courseId === '00000000-0000-0000-0000-000000000001' 
        ? 'keto-m' 
        : 'if-m'
      completedLessonsQuery = completedLessonsQuery.like('lesson_id', `${prefix}%`)
    } else {
      // Для обычных уроков нужно получить lesson_id из таблицы lessons
      const { data: courseLessons } = await adminSupabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
      
      if (courseLessons && courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id)
        completedLessonsQuery = completedLessonsQuery.in('lesson_id', lessonIds)
      } else {
        completedLessonsQuery = completedLessonsQuery.eq('lesson_id', '') // Пустой результат
      }
    }
    
    const { data: completedLessons } = await completedLessonsQuery

    // Подсчитываем общее количество уроков
    let totalLessons: number | null = null
    
    if (isStaticLesson) {
      // Для статических уроков получаем количество из статического API
      // Кето: 3 + 3 + 2 = 8 уроков, IF: 2 + 3 + 2 = 7 уроков
      const isKeto = courseId === COURSE_IDS.KETO || courseId === '1' || courseId === '00000000-0000-0000-0000-000000000001'
      totalLessons = isKeto ? 8 : 7 // 8 для кето (3+3+2), 7 для IF (2+3+2)
    } else {
      // Для обычных уроков считаем из БД
      const { count } = await adminSupabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId)
      totalLessons = count
    }

    const newProgress = totalLessons && totalLessons > 0
      ? Math.round(((completedLessons?.length || 0) / totalLessons) * 100)
      : 0

    // Обновляем enrollment
    const { error: enrollmentError } = await adminSupabase
      .from('enrollments')
      .update({
        progress: newProgress,
        ...(newProgress === 100 ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    if (enrollmentError) {
      console.error('Error updating enrollment progress:', enrollmentError)
      // Не возвращаем ошибку, так как урок уже отмечен как завершенный
    }

    return NextResponse.json({
      success: true,
      progress: newProgress
    })

  } catch (error: any) {
    console.error('Complete lesson API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

