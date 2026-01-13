'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Loader2, ChefHat } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { MenuGenerator } from '@/components/recipes/MenuGenerator'
import { Button } from '@/components/ui/Button'

export default function RecipesPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/courses/access?checkPurchased=true', {
          credentials: 'include'
        })
        const data = await response.json()
        setHasAccess(data.hasPurchased || false)
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setIsChecking(false)
      }
    }

    // Проверяем доступ независимо от того, загружен ли user на клиенте
    // Серверная проверка работает через cookies (session_token или telegram_id)
    checkAccess()
  }, [user]) // Перепроверяем при изменении user (если он загрузился)

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent-mint mx-auto mb-4" />
          <p className="text-white/60">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 rounded-2xl bg-gradient-to-br from-dark-800/90 via-dark-800/50 to-dark-900/90 border-2 border-white/10 backdrop-blur-xl shadow-2xl text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-mint/20 to-accent-teal/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-accent-mint" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Доступ ограничен</h1>
          <p className="text-white/70 mb-6">
            Генератор меню доступен только для пользователей, которые оплатили хотя бы один курс.
          </p>
          <Button
            onClick={() => router.push('/courses')}
            variant="primary"
            size="lg"
          >
            Посмотреть курсы
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-mint to-accent-teal flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-dark-900" />
            </div>
            <h1 className="text-4xl font-bold text-white">Генератор меню</h1>
          </div>
          <p className="text-white/60 text-lg">
            Создайте персональное меню на основе ваших предпочтений
          </p>
        </motion.div>

        <MenuGenerator />
      </div>
    </div>
  )
}

