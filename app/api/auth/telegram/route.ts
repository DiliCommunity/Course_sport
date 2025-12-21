import { NextRequest, NextResponse } from 'next/server'
import { getUserByTelegramId, createUser, updateUser } from '@/lib/vercel/kv'
import { createUserSession } from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, first_name, last_name, username, photo_url } = body

    if (!id || !first_name) {
      return NextResponse.json(
        { error: 'Telegram user data is required' },
        { status: 400 }
      )
    }

    const telegramId = String(id)
    const name = `${first_name} ${last_name || ''}`.trim()

    // Проверяем, есть ли пользователь
    let user = await getUserByTelegramId(telegramId)

    if (user) {
      // Обновляем данные пользователя
      user = await updateUser(user.id, {
        name,
        telegram_username: username || null,
        avatar_url: photo_url || null,
      })
    } else {
      // Создаём нового пользователя
      user = await createUser({
        name,
        telegram_id: telegramId,
        telegram_username: username || null,
        avatar_url: photo_url || null,
      })
    }

    const sessionId = await createUserSession(user.id)

    return NextResponse.json({
      success: true,
      user_id: user.id,
      telegram_id: user.telegram_id,
      session_id: sessionId,
    })
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
