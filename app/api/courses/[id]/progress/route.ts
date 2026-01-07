import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { COURSE_IDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Получаем завершенные уроки
    // Проверяем, есть ли статические уроки (по префиксу lesson_id)
    const isKeto = courseId === '1' || courseId === '00000000-0000-0000-0000-000000000001'
    const isInterval = courseId === '2' || courseId === '00000000-0000-0000-0000-000000000002'
    
    let completedProgressQuery = adminSupabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
    
    // Фильтруем по префиксу для статических уроков или по lesson_id из таблицы lessons
    if (isKeto || isInterval) {
      const prefix = isKeto ? 'keto-m' : 'if-m'
      completedProgressQuery = completedProgressQuery.like('lesson_id', `${prefix}%`)
    } else {
      // Для обычных курсов получаем lesson_id из таблицы lessons
      const { data: courseLessons } = await adminSupabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
      
      if (courseLessons && courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id)
        completedProgressQuery = completedProgressQuery.in('lesson_id', lessonIds)
      } else {
        completedProgressQuery = completedProgressQuery.eq('lesson_id', '') // Пустой результат
      }
    }
    
    const { data: completedProgress } = await completedProgressQuery

    // Получаем enrollment для общего прогресса
    const { data: enrollment } = await adminSupabase
      .from('enrollments')
      .select('progress')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    // Получаем общее количество уроков
    // Проверяем, есть ли статические уроки в прогрессе
    const hasStaticLessons = (completedProgress || []).some(p => 
      p.lesson_id.startsWith('keto-m') || p.lesson_id.startsWith('if-m')
    )
    
    let totalLessons: number | null = null
    
    if (hasStaticLessons) {
      // Для статических уроков используем фиксированное количество
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

    const completedLessons = (completedProgress || []).map(p => p.lesson_id)
    const overallProgress = totalLessons && totalLessons > 0
      ? Math.round((completedLessons.length / totalLessons) * 100)
      : 0

    return NextResponse.json({
      completedLessons,
      overallProgress,
      enrollment: enrollment || null
    })

  } catch (error: any) {
    console.error('Progress API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

