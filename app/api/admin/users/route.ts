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
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = adminSupabase
      .from('users')
      .select('id, email, phone, name, username, is_admin, is_referral_partner, referral_commission_percent, registration_method, telegram_id, telegram_username, vk_id, avatar_url, created_at, last_login', { count: 'exact' })

    // Apply filters
    if (filter === 'admins') {
      query = query.eq('is_admin', true)
    } else if (filter === 'partners') {
      query = query.eq('is_referral_partner', true)
    }

    // Apply search
    if (search) {
      query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%,name.ilike.%${search}%,username.ilike.%${search}%`)
    }

    // Order and paginate
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Admin Users] Query error:', error)
      throw error
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      totalPages
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке пользователей' },
      { status: 500 }
    )
  }
}

