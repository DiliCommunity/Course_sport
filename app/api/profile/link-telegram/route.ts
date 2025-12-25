import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * Связывает существующий аккаунт с Telegram ID
 * Используется когда пользователь входит по логину/паролю из Telegram WebApp
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем текущего пользователя из сессии
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { telegram_id, telegram_username } = body

    if (!telegram_id) {
      return NextResponse.json(
        { error: 'telegram_id is required' },
        { status: 400 }
      )
    }

    // Проверяем, не привязан ли этот Telegram ID к другому аккаунту
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: 'Этот Telegram аккаунт уже привязан к другому пользователю' },
        { status: 400 }
      )
    }

    // Связываем аккаунт с Telegram
    const { error: updateError } = await supabase
      .from('users')
      .update({
        telegram_id: telegram_id,
        telegram_username: telegram_username || null,
        telegram_verified: true,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Link Telegram error:', updateError)
      return NextResponse.json(
        { error: 'Failed to link Telegram account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram аккаунт успешно привязан',
    })
  } catch (error: any) {
    console.error('Link Telegram error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

