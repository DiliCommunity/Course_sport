import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin Payments] Starting request')
    
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user || !user.is_admin) {
      console.log('[Admin Payments] Access denied - not admin')
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    console.log('[Admin Payments] User is admin:', user.id)

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      console.error('[Admin Payments] Admin client not available')
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    console.log('[Admin Payments] Query params:', { page, limit, status })

    const offset = (page - 1) * limit

    // Build query - сначала получаем платежи без JOIN
    console.log('[Admin Payments] Building query...')
    
    try {
      let query = adminSupabase
        .from('payments')
        .select(`
          id, user_id, course_id, amount, status, payment_method, 
          created_at, updated_at, metadata, completed_at, currency
        `, { count: 'exact' })

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('status', status)
        console.log('[Admin Payments] Applied status filter:', status)
      }

      // Order and paginate
      console.log('[Admin Payments] Executing query...')
      const { data: payments, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('[Admin Payments] Query error:', error)
        console.error('[Admin Payments] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          stack: error.stack
        })
        
        // Возвращаем пустой результат вместо ошибки, чтобы страница загрузилась
        return NextResponse.json({
          payments: [],
          total: 0,
          page: 1,
          totalPages: 0,
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            totalRevenue: 0
          },
          error: 'Ошибка загрузки платежей',
          errorDetails: process.env.NODE_ENV === 'development' ? {
            message: error.message,
            code: error.code,
            details: error.details
          } : undefined
        })
      }

      console.log('[Admin Payments] Payments fetched:', payments?.length || 0, 'Total count:', count)

        // Получаем данные пользователей отдельным запросом
      const userIds = Array.from(new Set((payments || []).map((p: any) => p.user_id).filter(Boolean)))
      let usersMap: Record<string, any> = {}
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await adminSupabase
          .from('users')
          .select('id, name, email, phone, username, telegram_username')
          .in('id', userIds)
        
        if (usersError) {
          console.error('[Admin Payments] Error fetching users:', usersError)
          // Не прерываем выполнение, просто продолжаем без данных пользователей
        } else if (usersData) {
          usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
        }
      }

      // Get stats - с обработкой ошибок
      let totalCount = 0
      let completedCount = 0
      let pendingCount = 0
      let totalRevenue = 0

      try {
        const { count: total, error: totalError } = await adminSupabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
        
        if (!totalError) {
          totalCount = total || 0
        } else {
          console.error('[Admin Payments] Error getting total count:', totalError)
        }

        const { count: completed, error: completedError } = await adminSupabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
        
        if (!completedError) {
          completedCount = completed || 0
        } else {
          console.error('[Admin Payments] Error getting completed count:', completedError)
        }

        const { count: pending, error: pendingError } = await adminSupabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        
        if (!pendingError) {
          pendingCount = pending || 0
        } else {
          console.error('[Admin Payments] Error getting pending count:', pendingError)
        }

        const { data: revenueData, error: revenueError } = await adminSupabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')

        if (!revenueError && revenueData) {
          totalRevenue = revenueData.reduce((sum, p) => sum + (p.amount || 0), 0)
        } else if (revenueError) {
          console.error('[Admin Payments] Error getting revenue:', revenueError)
        }
      } catch (statsError: any) {
        console.error('[Admin Payments] Error calculating stats:', statsError)
        // Продолжаем выполнение даже если статистика не получена
      }

      const totalPages = Math.ceil((count || 0) / limit)

      console.log('[Admin Payments] Processing payments...')

      // Обрабатываем payments и добавляем данные пользователя
      const processedPayments = (payments || []).map((payment: any) => {
        // Безопасно обрабатываем metadata (может быть JSONB или объектом)
        let metadata: Record<string, any> = {}
        try {
          if (typeof payment.metadata === 'string') {
            metadata = JSON.parse(payment.metadata)
          } else if (payment.metadata && typeof payment.metadata === 'object') {
            metadata = payment.metadata as Record<string, any>
          }
        } catch (e) {
          console.warn('[Admin Payments] Error parsing metadata for payment', payment.id, ':', e)
          metadata = {}
        }
        
        const user = usersMap[payment.user_id] || null
        
        // Безопасно извлекаем данные курса
        let courseName = null
        if (payment.course_id) {
          // Можно добавить запрос к таблице courses, но пока оставляем null
          courseName = null
        }
        
        return {
          id: payment.id,
          user_id: payment.user_id,
          course_id: payment.course_id,
          course_name: courseName,
          amount: payment.amount || 0,
          status: payment.status || 'pending',
          payment_method: payment.payment_method || null,
          currency: payment.currency || 'RUB',
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          completed_at: payment.completed_at || null,
          yookassa_payment_id: metadata.yookassa_payment_id || null,
          is_full_access: metadata.is_full_access || false,
          user: user ? {
            name: user.name || null,
            email: user.email || null,
            phone: user.phone || null,
            username: user.username || null,
            telegram_username: user.telegram_username || null
          } : null
        }
      })

      console.log('[Admin Payments] Processed payments:', processedPayments.length)
      console.log('[Admin Payments] Returning response with stats:', {
        total: count || 0,
        totalCount,
        completedCount,
        pendingCount,
        totalRevenue
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
    } catch (queryError: any) {
      console.error('[Admin Payments] Query execution error:', queryError)
      // Возвращаем пустой результат вместо ошибки
      return NextResponse.json({
        payments: [],
        total: 0,
        page: 1,
        totalPages: 0,
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          totalRevenue: 0
        },
        error: 'Ошибка выполнения запроса',
        errorDetails: process.env.NODE_ENV === 'development' ? {
          message: queryError?.message,
          code: queryError?.code
        } : undefined
      })
    }

  } catch (error: any) {
    console.error('[Admin Payments] Error fetching payments:', error)
    console.error('[Admin Payments] Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    })
    return NextResponse.json(
      { 
        error: 'Ошибка при загрузке платежей',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

