'use client'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  telegram_id?: string
}

export async function signUp(email: string, password: string, name: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Registration failed')
  }

  const data = await response.json()
  return { user: { id: data.user_id, email: data.email }, error: null }
}

export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }

  const data = await response.json()
  return { user: { id: data.user_id, email: data.email }, error: null }
}

export async function signInWithTelegram(telegramUser: {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}) {
  const response = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      photo_url: telegramUser.photo_url,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Telegram auth failed')
  }

  const data = await response.json()
  return { userId: data.user_id, telegramId: data.telegram_id }
}

export async function signOut() {
  await fetch('/api/auth/logout', {
    method: 'POST',
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/profile/data')
    if (!response.ok) return null
    const data = await response.json()
    return data.user
  } catch {
    return null
  }
}

export async function getSession() {
  // Сессии теперь управляются через cookies на сервере
  return null
}
