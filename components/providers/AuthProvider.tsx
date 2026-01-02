'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegram } from './TelegramProvider'

interface AuthUser {
  id: string
  email?: string
  phone?: string
  name?: string
  username?: string
  avatar_url?: string
  telegram_id?: string
  telegram_username?: string
  is_admin?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authAttempted, setAuthAttempted] = useState(false)
  const router = useRouter()
  const { user: telegramUser, isTelegramApp, isReady } = useTelegram()

  // Функция для получения профиля пользователя
  const fetchProfile = useCallback(async () => {
    try {
      console.log('[AuthProvider] Fetching profile...')
      const response = await fetch('/api/profile/data', {
        credentials: 'include',
      })

      console.log('[AuthProvider] Profile response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[AuthProvider] Profile loaded for user:', data.user?.id, data.user?.username)
        setUser({
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          name: data.user.name,
          username: data.user.username,
          avatar_url: data.user.avatar_url,
          telegram_id: data.user.telegram_id,
          telegram_username: data.user.telegram_username,
          is_admin: data.user.is_admin,
        })
        return true
      }
      console.log('[AuthProvider] No session found or error')
      return false
    } catch (error) {
      console.error('[AuthProvider] Fetch profile error:', error)
      return false
    }
  }, [])

  // Авторизация через Telegram
  const authViaTelegram = useCallback(async () => {
    if (!telegramUser) return false

    try {
      // Получаем реферальный код из sessionStorage (если есть)
      const referralCode = typeof window !== 'undefined' ? sessionStorage.getItem('pending_referral') : null
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          photo_url: telegramUser.photo_url,
          referralCode: referralCode || null,
        }),
      })
      
      // Если реферальный код был использован - удаляем его
      if (referralCode && response.ok) {
        sessionStorage.removeItem('pending_referral')
      }

      if (!response.ok) {
        console.error('Telegram auth failed:', await response.text())
        return false
      }

      const data = await response.json()
      console.log('Telegram auth success:', data)
      
      // После успешной авторизации получаем профиль
      return await fetchProfile()
    } catch (error) {
      console.error('Telegram auth error:', error)
      return false
    }
  }, [telegramUser, fetchProfile])

  // Основная логика авторизации
  useEffect(() => {
    if (!isReady || authAttempted) return

    const initAuth = async () => {
      console.log('[AuthProvider] Init auth started. isReady:', isReady, 'isTelegramApp:', isTelegramApp)
      setLoading(true)

      // Проверяем, есть ли уже сессия
      const hasSession = await fetchProfile()
      
      if (hasSession) {
        console.log('[AuthProvider] Session found, auth complete')
        setLoading(false)
        setAuthAttempted(true)
        return
      }

      // Не авторизуем автоматически - пользователь должен нажать кнопку "Войти через Telegram"
      console.log('[AuthProvider] Auth init complete - no session, waiting for user action')
      setLoading(false)
      setAuthAttempted(true)
    }

    initAuth()
  }, [isReady, authAttempted, fetchProfile])

  // Функция выхода
  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Функция обновления пользователя
  const refreshUser = async () => {
    await fetchProfile()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
