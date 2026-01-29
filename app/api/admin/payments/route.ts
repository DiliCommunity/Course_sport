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
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const offset = (page - 1) * limit

    // Build query
    let query = adminSupabase
      .from('payments')
      .select(`
        id, user_id, course_id, amount, status, payment_method, 
        yookassa_payment_id, is_full_access, created_at, updated_at,
        user:users(name, email, phone)
      `, { count: 'exact' })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Order and paginate
    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get stats
    const { count: totalCount } = await adminSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })

    const { count: completedCount } = await adminSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: pendingCount } = await adminSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { data: revenueData } = await adminSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      page,
      totalPages,
      stats: {
        total: totalCount || 0,
        completed: completedCount || 0,
        pending: pendingCount || 0,
        totalRevenue
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке платежей' },
      { status: 500 }
    )
  }
}

