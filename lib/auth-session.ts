import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface User {
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
 * Получает текущего пользователя из сессии
 * Использует cookie session_token для проверки
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    const telegramId = cookieStore.get('telegram_id')?.value

    if (!sessionToken && !telegramId) {
      return null
    }

    const supabase = await createClient()

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
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

/**
 * Проверяет, авторизован ли пользователь
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Проверяет, является ли пользователь администратором
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.is_admin === true
}
