import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * API для админа: получение списка заявок на вывод
 * GET /api/admin/withdrawals - получить все заявки
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'processing', 'completed', 'failed', 'all'

    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          telegram_username,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: withdrawals, error } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
      count: withdrawals?.length || 0
    })

  } catch (error: any) {
    console.error('Error in admin withdrawals API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

