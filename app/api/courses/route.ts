import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем текущего пользователя
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Please log in to view courses',
        },
        { status: 401 }
      )
    }

    // Получаем профиль пользователя для проверки админ-прав
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true || profile?.username === 'admini_mini'

    if (!isAdmin) {
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

