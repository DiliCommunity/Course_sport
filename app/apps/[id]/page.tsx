'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

// Импортируем компоненты приложений
import { MacroCalculator } from '@/components/lessons/MacroCalculator'
import { KetoFluCalculator } from '@/components/lessons/KetoFluCalculator'
import { IFCalculator } from '@/components/lessons/IFCalculator'
import { ShoppingListGenerator } from '@/components/lessons/ShoppingListGenerator'
import { KetoRecipeGenerator } from '@/components/lessons/KetoRecipeGenerator'
import { HungerTracker } from '@/components/lessons/HungerTracker'
import { IFProgressTracker } from '@/components/lessons/IFProgressTracker'
import { ProgressNotesTracker } from '@/components/lessons/ProgressNotesTracker'
import { FastingWorkoutGenerator } from '@/components/lessons/FastingWorkoutGenerator'

// Маппинг ID приложений на компоненты
const appComponents: Record<string, React.ComponentType<any>> = {
  'macro-calculator': MacroCalculator,
  'keto-flu-calculator': KetoFluCalculator,
  'if-calculator': IFCalculator,
  'shopping-list': ShoppingListGenerator,
  'recipe-generator': KetoRecipeGenerator,
  'hunger-tracker': HungerTracker,
  'if-progress-tracker': IFProgressTracker,
  'progress-notes': ProgressNotesTracker,
  'fasting-workout': FastingWorkoutGenerator,
}

// Названия приложений
const appTitles: Record<string, string> = {
  'macro-calculator': 'Калькулятор макросов',
  'keto-flu-calculator': 'Калькулятор кетогриппа',
  'if-calculator': 'Калькулятор интервального голодания',
  'shopping-list': 'Список покупок',
  'recipe-generator': 'Генератор рецептов',
  'hunger-tracker': 'Трекер голода',
  'if-progress-tracker': 'Трекер прогресса IF',
  'progress-notes': 'Заметки о прогрессе',
  'fasting-workout': 'Тренировки на голодный желудок',
}

export default function AppPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  const appId = params.id as string
  const AppComponent = appComponents[appId]
  const appTitle = appTitles[appId]

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/profile/data', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          const fallbackResponse = await fetch('/api/courses/access?check_purchased=true', {
            credentials: 'include'
          })
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            setHasAccess(fallbackData.hasPurchased === true)
          } else {
            setHasAccess(false)
          }
          setIsCheckingAccess(false)
          return
        }
        
        const data = await response.json()
        const hasAccessToApps = (data.enrollments && data.enrollments.length > 0)
        setHasAccess(hasAccessToApps)
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [user, authLoading, router])

  // Блокируем прокрутку body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.classList.add('modal-open')
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
  }, [])

  if (isCheckingAccess || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            <X className="w-10 h-10 text-accent-mint" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Доступ ограничен</h1>
          <p className="text-white/70 mb-6">
            Приложения доступны только для пользователей, которые приобрели хотя бы один курс.
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg transition-all"
          >
            Посмотреть курсы
          </button>
        </motion.div>
      </div>
    )
  }

  if (!AppComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 rounded-2xl bg-gradient-to-br from-dark-800/90 via-dark-800/50 to-dark-900/90 border-2 border-white/10 backdrop-blur-xl shadow-2xl text-center"
        >
          <h1 className="text-2xl font-bold text-white mb-4">Приложение не найдено</h1>
          <p className="text-white/70 mb-6">
            Приложение с ID "{appId}" не существует.
          </p>
          <button
            onClick={() => router.push('/apps')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg transition-all"
          >
            Вернуться к приложениям
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-dark-900/95 z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <button
              onClick={() => router.push('/apps')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к приложениям</span>
            </button>
            
            <h1 className="font-display font-bold text-2xl text-white">
              {appTitle}
            </h1>
            
            <div className="w-[120px]" /> {/* Spacer для выравнивания */}
          </div>

          {/* App Content */}
          <div className="mt-8">
            <AppComponent />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

