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

    const body = await request.json()
    const { wallet_address } = body

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Обновляем профиль пользователя
    const { error: updateError } = await supabase
      .from('users')
      .update({
        telegram_wallet_address: wallet_address,
        telegram_wallet_connected: true,
        telegram_wallet_connected_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update wallet error:', updateError)
      return NextResponse.json(
        { error: 'Failed to connect wallet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet connected successfully',
    })
  } catch (error: any) {
    console.error('Connect wallet error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
