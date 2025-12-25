import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем текущего пользователя из сессии
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Please log in to view courses',
        },
        { status: 401 }
      )
    }

    // Проверяем админ-права
    if (!user.is_admin) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin access required',
        },
        { status: 403 }
      )
    }

    // Получаем все курсы для админа
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('Courses error:', coursesError)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      courses: courses || [],
    })
  } catch (error: any) {
    console.error('Courses API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
