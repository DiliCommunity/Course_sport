'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTelegram } from './TelegramProvider'

interface AuthUser {
  id: string
  email?: string
  phone?: string
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
    // Создаем клиент только внутри useEffect
    let supabase: ReturnType<typeof createClient> | null = null
    try {
      supabase = createClient()
    } catch (error) {
      console.warn('Supabase client not available:', error)
      setLoading(false)
      return
    }

    // Получаем текущую сессию Supabase
    async function fetchUser() {
      if (!supabase) {
        setLoading(false)
        return
      }
      
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          // Получаем профиль пользователя
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profile) {
            setUser({
              id: authUser.id,
              email: authUser.email,
              phone: authUser.phone,
              name: profile.name,
              avatar_url: profile.avatar_url,
              telegram_id: profile.telegram_id,
            })
          } else {
            setUser({
              id: authUser.id,
              email: authUser.email,
              phone: authUser.phone,
            })
          }
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
                if (authData.user) {
                  setUser({
                    id: authData.user.id,
                    email: authData.user.email,
                    phone: authData.user.phone,
                    telegram_id: String(telegramUser.id),
                  })
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

    // Слушаем изменения в авторизации
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Обновляем пользователя при изменении сессии
        fetchUser()
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isTelegramApp, telegramUser])

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
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
