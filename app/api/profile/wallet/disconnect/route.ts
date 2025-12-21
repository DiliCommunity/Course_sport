import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
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
