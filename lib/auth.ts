'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  telegram_id?: string
}

export async function signUp(email: string, password: string, name: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) throw error

  // Создаём запись в таблице users
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email,
      name: name,
    } as never)
  }

  return { user: data.user, error: null }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return { user: data.user, error: null }
}

export async function signInWithTelegram(telegramUser: {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}) {
  const supabase = createClient()
  const telegramId = String(telegramUser.id)
  
  // Проверяем, есть ли пользователь в БД
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  let userId: string

  if (existingUser) {
    // Пользователь уже есть, обновляем данные
    userId = (existingUser as any).id
    await supabase
      .from('users')
      .update({
        name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
        telegram_username: telegramUser.username || null,
        avatar_url: telegramUser.photo_url || null,
      } as never)
      .eq('telegram_id', telegramId)
  } else {
    // Создаём нового пользователя
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
        telegram_id: telegramId,
        telegram_username: telegramUser.username || null,
        avatar_url: telegramUser.photo_url || null,
      } as never)
      .select()
      .single()

    if (insertError) throw insertError
    userId = (newUser as any).id
  }

  // Создаём сессию через Supabase Auth (используем magic link для Telegram)
  // Для упрощения создаём временный токен или используем существующую систему
  return { userId, telegramId }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
