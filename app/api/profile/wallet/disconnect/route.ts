import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Отключаем wallet
    const { error: updateError } = await supabase
      .from('users')
      .update({
        telegram_wallet_address: null,
        telegram_wallet_connected: false,
        telegram_wallet_connected_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Disconnect wallet error:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect wallet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet disconnected successfully',
    })
  } catch (error: any) {
    console.error('Disconnect wallet error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
