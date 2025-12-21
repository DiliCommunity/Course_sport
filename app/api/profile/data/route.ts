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

    // Получаем рефералы
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    // Получаем транзакции
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        ...profile,
      },
      balance: balance || {
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      },
      enrollments: enrollments || [],
      referrals: referrals || [],
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
