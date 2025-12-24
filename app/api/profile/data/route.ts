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
          message: 'Please log in to view your profile',
        },
        { status: 401 }
      )
    }

    // Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Получаем баланс
    const { data: balance, error: balanceError } = await supabase
      .from('user_balance')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем записи на курсы
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Получаем реферальный код пользователя
    const { data: referralCode, error: referralCodeError } = await supabase
      .from('user_referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем рефералов (кого пригласил пользователь)
    const { data: referrals, error: referralsError } = await supabase
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
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Проверяем, является ли пользователь админом
    const isAdmin = profile?.is_admin === true || profile?.username === 'admini_mini'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || profile?.email,
        phone: profile?.phone || null,
        ...profile,
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
