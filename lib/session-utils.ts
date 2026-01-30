import { cookies, headers } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface SessionUser {
  id: string
  email?: string | null
  phone?: string | null
  name?: string | null
  username?: string | null
  avatar_url?: string | null
  telegram_id?: string | null
  telegram_username?: string | null
  telegram_wallet_address?: string | null
  telegram_wallet_connected?: boolean | null
  telegram_wallet_connected_at?: string | null
  registration_method?: string | null
  created_at?: string | null
  updated_at?: string | null
  last_login?: string | null
  phone_verified?: boolean | null
  email_verified?: boolean | null
  telegram_verified?: boolean | null
  is_admin?: boolean
  is_referral_partner?: boolean
  referral_commission_percent?: number | null
}

/**
 * Получает пользователя из сессии для использования в API routes
 * Проверяет: 1) X-Session-Token header (для VK Mini App), 2) cookie session_token, 3) telegram_id
 * ВАЖНО: Использует admin клиент для обхода RLS
 */
export async function getUserFromSession(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Используем admin клиент для обхода RLS
  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    console.error('[Session] Admin client not available')
    return null
  }
  
  // Приоритет: 1) Header (для VK Mini App где cookies не работают), 2) Cookie
  const headerToken = headersList.get('x-session-token')
  const cookieToken = cookieStore.get('session_token')?.value
  const sessionToken = headerToken || cookieToken
  const telegramId = cookieStore.get('telegram_id')?.value

  console.log('[Session] Checking session. HeaderToken:', !!headerToken, 'CookieToken:', !!cookieToken, 'TelegramId:', !!telegramId)

  if (!sessionToken && !telegramId) {
    console.log('[Session] No session token or telegram_id found')
    return null
  }

  // Проверяем сессию по токену
  if (sessionToken) {
    console.log('[Session] Checking session token...')
    const { data: session, error: sessionError } = await adminSupabase
      .from('sessions')
      .select('user_id, expires_at, is_active')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      console.log('[Session] Session not found or error:', sessionError?.message)
      return null
    }

    // Проверяем срок действия
    if (new Date(session.expires_at) < new Date()) {
      console.log('[Session] Session expired at:', session.expires_at)
      return null
    }

    console.log('[Session] Valid session found for user:', session.user_id)

    // Обновляем last_activity
    await adminSupabase
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('token', sessionToken)

    // Получаем пользователя
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single()

    if (userError || !user) {
      console.log('[Session] User not found:', userError?.message)
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
      telegram_wallet_address: user.telegram_wallet_address,
      telegram_wallet_connected: user.telegram_wallet_connected,
      telegram_wallet_connected_at: user.telegram_wallet_connected_at,
      registration_method: user.registration_method,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      phone_verified: user.phone_verified,
      email_verified: user.email_verified,
      telegram_verified: user.telegram_verified,
      is_admin: user.is_admin === true || user.username === 'admini_mini',
      is_referral_partner: user.is_referral_partner,
      referral_commission_percent: user.referral_commission_percent,
    }
  }

  // Fallback: проверяем по telegram_id
  if (telegramId) {
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (userError || !user) {
      console.log('[Session] Telegram user not found:', userError?.message)
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
      telegram_wallet_address: user.telegram_wallet_address,
      telegram_wallet_connected: user.telegram_wallet_connected,
      telegram_wallet_connected_at: user.telegram_wallet_connected_at,
      registration_method: user.registration_method,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      phone_verified: user.phone_verified,
      email_verified: user.email_verified,
      telegram_verified: user.telegram_verified,
      is_admin: user.is_admin === true || user.username === 'admini_mini',
      is_referral_partner: user.is_referral_partner,
      referral_commission_percent: user.referral_commission_percent,
    }
  }

  return null
}
