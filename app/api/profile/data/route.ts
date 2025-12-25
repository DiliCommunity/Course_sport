import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем пользователя из сессии
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Please log in to view your profile',
        },
        { status: 401 }
      )
    }

    // Получаем баланс
    const { data: balance } = await supabase
      .from('user_balance')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем записи на курсы
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Получаем реферальный код пользователя
    const { data: referralCode } = await supabase
      .from('user_referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем рефералов (кого пригласил пользователь)
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referrals_referred_id_fkey(id, name, email, phone, telegram_username, created_at)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    // Получаем статистику по рефералам
    const { data: referralStats } = await supabase
      .from('referrals')
      .select('referrer_earned, total_earned_from_purchases, status')
      .eq('referrer_id', user.id)

    // Вычисляем статистику
    const totalReferrals = referrals?.length || 0
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0
    const totalEarned = referralStats?.reduce((sum, r) => sum + (r.referrer_earned || 0) + (r.total_earned_from_purchases || 0), 0) || 0

    // Получаем транзакции
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Проверяем, является ли пользователь админом
    const isAdmin = user.is_admin === true || user.username === 'admini_mini'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        username: user.username,
        avatar_url: user.avatar_url,
        telegram_id: user.telegram_id,
        telegram_username: user.telegram_username,
        telegram_wallet_address: user.telegram_wallet_address,
        telegram_wallet_connected: user.telegram_wallet_connected,
        registration_method: user.registration_method,
        created_at: user.created_at,
        is_admin: isAdmin,
      },
      balance: balance || {
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      },
      referralCode: referralCode || null,
      referrals: referrals || [],
      referralStats: {
        total: totalReferrals,
        active: activeReferrals,
        totalEarned: totalEarned,
      },
      enrollments: enrollments || [],
      transactions: transactions || [],
    })
  } catch (error: any) {
    console.error('Profile data error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
