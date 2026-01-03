import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

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
    const { data: completedProgress } = await adminSupabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true)

    // Получаем enrollment для общего прогресса
    const { data: enrollment } = await adminSupabase
      .from('enrollments')
      .select('progress')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    // Получаем общее количество уроков
    const { count: totalLessons } = await adminSupabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)

    const completedLessons = (completedProgress || []).map(p => p.lesson_id)
    const overallProgress = totalLessons 
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

