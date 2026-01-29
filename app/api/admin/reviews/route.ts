import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') || 'pending'

    const offset = (page - 1) * limit

    // Build query
    let query = adminSupabase
      .from('reviews')
      .select('*', { count: 'exact' })

    // Apply filter
    if (filter === 'pending') {
      query = query.eq('is_approved', false)
    } else if (filter === 'approved') {
      query = query.eq('is_approved', true)
    }

    // Order and paginate
    const { data: reviews, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get stats
    const { count: totalCount } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })

    const { count: pendingCount } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)

    const { count: approvedCount } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)

    const { data: ratingsData } = await adminSupabase
      .from('reviews')
      .select('rating')
      .eq('is_approved', true)

    const averageRating = ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
      : 0

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      page,
      totalPages,
      stats: {
        total: totalCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        averageRating
      }
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке отзывов' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID отзыва обязателен' },
        { status: 400 }
      )
    }

    const { error } = await adminSupabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Отзыв удалён'
    })

  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении отзыва' },
      { status: 500 }
    )
  }
}

