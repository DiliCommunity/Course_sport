import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-session'
import { getUserBalance } from '@/lib/vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique referral code
    const referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`

    // Ensure user has balance record
    await getUserBalance(user.id)

    return NextResponse.json({ referralCode })
  } catch (error: any) {
    console.error('Referral generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
