'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

/**
 * Главная страница для Telegram WebApp
 * (Браузер сюда не попадёт - middleware редиректит на index.html)
 */
export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Авторизован - на курсы
    if (user) {
      router.replace('/courses')
    } else {
      // Не авторизован - на логин
      router.replace('/login')
    }
  }, [user, loading, router])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/60">Загрузка...</p>
      </div>
    </main>
  )
}
