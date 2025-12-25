'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTelegram } from '@/components/providers/TelegramProvider'

/**
 * Главная страница
 * - Для авторизованных пользователей: показывает курсы
 * - Для неавторизованных в Telegram: показывает курсы
 * - Для неавторизованных в браузере: редирект на index.html
 */
export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { isTelegramApp, isReady } = useTelegram()

  useEffect(() => {
    if (loading || !isReady) return

    // Если пользователь авторизован - показываем курсы
    if (user) {
      router.replace('/courses')
      return
    }

    // Если это Telegram - показываем логин
    if (isTelegramApp) {
      router.replace('/login')
      return
    }

    // Обычный браузер без авторизации - редирект на HTML версию
    window.location.replace('/index.html')
  }, [user, loading, isTelegramApp, isReady, router])

  // Показываем загрузку пока определяемся
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/60">Загрузка...</p>
      </div>
    </main>
  )
}

