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

    // Build query - сначала получаем платежи без JOIN
    let query = adminSupabase
      .from('payments')
      .select(`
        id, user_id, course_id, amount, status, payment_method, 
        yookassa_payment_id, created_at, updated_at, metadata
      `, { count: 'exact' })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Order and paginate
    const { data: payments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Admin Payments] Query error:', error)
      throw error
    }

    // Получаем данные пользователей отдельным запросом
    const userIds = Array.from(new Set((payments || []).map((p: any) => p.user_id).filter(Boolean)))
    let usersMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: usersData } = await adminSupabase
        .from('users')
        .select('id, name, email, phone, username, telegram_username')
        .in('id', userIds)
      
      if (usersData) {
        usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
      }
    }

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

    // Обрабатываем payments и добавляем данные пользователя
    const processedPayments = (payments || []).map((payment: any) => {
      const metadata = payment.metadata || {}
      const user = usersMap[payment.user_id] || null
      return {
        ...payment,
        is_full_access: metadata.is_full_access || false,
        user: user ? {
          name: user.name,
          email: user.email,
          phone: user.phone,
          username: user.username,
          telegram_username: user.telegram_username
        } : null
      }
    })

    return NextResponse.json({
      payments: processedPayments,
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

