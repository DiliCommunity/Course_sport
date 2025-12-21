import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Get balance
    const { data: balanceData } = await supabase
      .from('user_balance')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get enrollments with course details
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(
        `
        *,
        courses (
          id,
          title,
          image_url,
          price,
          duration_minutes,
          rating,
          students_count
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get referrals (as referrer)
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    // Get referral code (generate if doesn't exist)
    let referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}`
    const existingReferral = referrals?.find((r) => r.referral_code)
    if (existingReferral) {
      referralCode = existingReferral.referral_code
    }

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Calculate referral stats
    const referralStats = {
      total_referred: referrals?.length || 0,
      total_earned: balanceData?.total_earned || 0,
      active_referrals: referrals?.filter((r) => r.status === 'active').length || 0,
      completed_referrals: referrals?.filter((r) => r.status === 'completed').length || 0,
    }

    return NextResponse.json({
      user: userData,
      balance: balanceData || {
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      },
      enrollments: enrollments || [],
      referralCode,
      referralStats,
      transactions: transactions || [],
    })
  } catch (error: any) {
    console.error('Profile data error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
