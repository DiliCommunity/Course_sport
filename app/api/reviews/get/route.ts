import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true) // Только одобренные отзывы
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (courseId && courseId !== 'all') {
      query = query.eq('course_id', courseId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Ошибка при получении отзывов' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reviews: reviews || [],
      total: reviews?.length || 0
    })
  } catch (error: any) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

