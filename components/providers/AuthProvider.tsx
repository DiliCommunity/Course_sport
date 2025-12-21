'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegram } from './TelegramProvider'

interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  telegram_id?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
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
  const router = useRouter()
  const { user: telegramUser, isTelegramApp } = useTelegram()

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/profile/data')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // Если нет сессии, проверяем Telegram
          if (isTelegramApp && telegramUser) {
            // Авторизуем через Telegram
            try {
              const authResponse = await fetch('/api/auth/telegram', {
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
              if (authResponse.ok) {
                const authData = await authResponse.json()
                // Получаем данные пользователя
                const profileResponse = await fetch('/api/profile/data')
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json()
                  setUser(profileData.user)
                }
              }
            } catch (error) {
              console.error('Telegram auth error:', error)
            }
          }
        }
      } catch (error) {
        console.error('Auth fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [isTelegramApp, telegramUser])

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
