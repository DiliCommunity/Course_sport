import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique referral code
    const referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`

    // Ensure user has balance record
    const { data: balanceData } = await supabase
      .from('user_balance')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!balanceData) {
      await supabase.from('user_balance').insert({
        user_id: user.id,
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      } as never)
    }

    return NextResponse.json({ referralCode })
  } catch (error: any) {
    console.error('Referral generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
