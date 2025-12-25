import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface SessionUser {
  id: string
  email?: string
  phone?: string
  name?: string
  username?: string
  avatar_url?: string | null
  telegram_id?: string | null
  telegram_username?: string | null
  is_admin?: boolean
}

/**
 * Получает пользователя из сессии для использования в API routes
 * Проверяет cookie session_token и telegram_id
 */
export async function getUserFromSession(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  const telegramId = cookieStore.get('telegram_id')?.value

  if (!sessionToken && !telegramId) {
    return null
  }

  // Проверяем сессию по токену
  if (sessionToken) {
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, expires_at, is_active')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return null
    }

    // Проверяем срок действия
    if (new Date(session.expires_at) < new Date()) {
      return null
    }

    // Обновляем last_activity
    await supabase
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('token', sessionToken)

    // Получаем пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single()

    if (userError || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      is_admin: user.is_admin === true || user.username === 'admini_mini',
    }
  }

  // Fallback: проверяем по telegram_id
  if (telegramId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (userError || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      is_admin: user.is_admin === true || user.username === 'admini_mini',
    }
  }

  return null
}

