'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  Calculator, UtensilsCrossed, Activity, TrendingUp, 
  Calendar, ShoppingCart, Heart, Target, Zap, Loader2, 
  Lock, AlertCircle, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface App {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  href: string
  category: 'calculator' | 'generator' | 'tracker' | 'workout'
  badge?: string
}

const apps: App[] = [
  // Калькуляторы
  {
    id: 'macro-calculator',
    title: 'Калькулятор макросов',
    description: 'Рассчитайте оптимальное количество белков, жиров и углеводов для ваших целей',
    icon: <Calculator className="w-8 h-8" />,
    gradient: 'from-blue-500 to-cyan-500',
    href: '/apps/macro-calculator',
    category: 'calculator'
  },
  {
    id: 'keto-flu-calculator',
    title: 'Калькулятор кетогриппа',
    description: 'Оцените симптомы и получите рекомендации по преодолению кетогриппа',
    icon: <Heart className="w-8 h-8" />,
    gradient: 'from-purple-500 to-pink-500',
    href: '/apps/keto-flu-calculator',
    category: 'calculator'
  },
  {
    id: 'if-calculator',
    title: 'Калькулятор интервального голодания',
    description: 'Рассчитайте оптимальные окна приема пищи для вашего режима IF',
    icon: <Calendar className="w-8 h-8" />,
    gradient: 'from-orange-500 to-red-500',
    href: '/apps/if-calculator',
    category: 'calculator'
  },
  
  // Генераторы
  {
    id: 'menu-generator',
    title: 'Личный шеф',
    description: 'Создайте персональное кето-меню на день, неделю или месяц',
    icon: <UtensilsCrossed className="w-8 h-8" />,
    gradient: 'from-accent-gold to-accent-electric',
    href: '/recipes',
    category: 'generator'
  },
  {
    id: 'shopping-list',
    title: 'Список покупок',
    description: 'Автоматически создавайте списки продуктов для вашего меню',
    icon: <ShoppingCart className="w-8 h-8" />,
    gradient: 'from-yellow-500 to-orange-500',
    href: '/apps/shopping-list',
    category: 'generator'
  },
  {
    id: 'recipe-generator',
    title: 'Генератор рецептов',
    description: 'Создавайте уникальные кето-рецепты под ваши предпочтения',
    icon: <UtensilsCrossed className="w-8 h-8" />,
    gradient: 'from-green-500 to-emerald-500',
    href: '/apps/recipe-generator',
    category: 'generator'
  },
  
  // Трекеры
  {
    id: 'hunger-tracker',
    title: 'Трекер голода',
    description: 'Отслеживайте уровень голода и связь с питанием',
    icon: <TrendingUp className="w-8 h-8" />,
    gradient: 'from-indigo-500 to-purple-500',
    href: '/apps/hunger-tracker',
    category: 'tracker'
  },
  {
    id: 'if-progress-tracker',
    title: 'Трекер прогресса IF',
    description: 'Мониторинг результатов интервального голодания',
    icon: <Target className="w-8 h-8" />,
    gradient: 'from-pink-500 to-rose-500',
    href: '/apps/if-progress-tracker',
    category: 'tracker'
  },
  {
    id: 'progress-notes',
    title: 'Заметки о прогрессе',
    description: 'Ведите дневник изменений в теле и самочувствии',
    icon: <Heart className="w-8 h-8" />,
    gradient: 'from-red-500 to-pink-500',
    href: '/apps/progress-notes',
    category: 'tracker'
  },
  
  // Генераторы тренировок
  {
    id: 'workout-generator',
    title: 'Генератор тренировок',
    description: 'Персональные тренировки для спортсменов и любителей',
    icon: <Activity className="w-8 h-8" />,
    gradient: 'from-blue-600 to-indigo-600',
    href: '/apps/workouts',
    category: 'workout',
    badge: 'Новое'
  },
  {
    id: 'fasting-workout',
    title: 'Тренировки на голодный желудок',
    description: 'Специальные программы для совмещения с интервальным голоданием',
    icon: <Zap className="w-8 h-8" />,
    gradient: 'from-amber-500 to-yellow-500',
    href: '/apps/fasting-workout',
    category: 'workout'
  }
]

export default function AppsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | App['category']>('all')

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Проверяем доступ через /api/profile/data - там правильная логика проверки покупок
        const response = await fetch('/api/profile/data', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          console.error('[AppsPage] Profile data fetch failed:', response.status, response.statusText)
          // Fallback: пробуем через /api/courses/access
          const fallbackResponse = await fetch('/api/courses/access?check_purchased=true', {
            credentials: 'include'
          })
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            console.log('[AppsPage] Fallback access check:', fallbackData)
            setHasAccess(fallbackData.hasPurchased === true)
          } else {
            setHasAccess(false)
          }
          setIsCheckingAccess(false)
          return
        }
        
        const data = await response.json()
        console.log('[AppsPage] Profile data response:', {
          enrollmentsCount: data.enrollments?.length || 0,
          user: !!data.user
        })
        
        // Проверяем, есть ли хотя бы один курс (enrollments)
        const hasAccessToApps = (data.enrollments && data.enrollments.length > 0)
        console.log('[AppsPage] User has access to apps:', hasAccessToApps)
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

  const filteredApps = selectedCategory === 'all' 
    ? apps 
    : apps.filter(app => app.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'Все', count: apps.length },
    { id: 'calculator', label: 'Калькуляторы', count: apps.filter(a => a.category === 'calculator').length },
    { id: 'generator', label: 'Генераторы', count: apps.filter(a => a.category === 'generator').length },
    { id: 'tracker', label: 'Трекеры', count: apps.filter(a => a.category === 'tracker').length },
    { id: 'workout', label: 'Тренировки', count: apps.filter(a => a.category === 'workout').length },
  ]

  if (isCheckingAccess || authLoading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center px-4 pb-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-white/60">Проверка доступа...</p>
        </div>
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="card p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Доступ ограничен
            </h1>
            <p className="text-white/60 mb-6">
              Эта страница доступна только пользователям, которые приобрели хотя бы один курс.
            </p>
            <Link href="/courses">
              <motion.button
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Перейти к курсам
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Мои приложения
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Все инструменты для достижения ваших целей в одном месте
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 justify-center mb-8"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900'
                  : 'bg-dark-800 border border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </motion.div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={app.href}>
                <motion.div
                  className="card p-6 h-full flex flex-col hover:border-accent-electric/50 transition-all group cursor-pointer relative overflow-hidden"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  {/* Badge */}
                  {app.badge && (
                    <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 text-xs font-bold">
                      {app.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                    {app.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                    {app.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 flex-grow relative z-10">
                    {app.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center text-accent-electric relative z-10 group-hover:translate-x-2 transition-transform">
                    <span className="text-sm font-medium">Открыть</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">Приложения в этой категории не найдены</p>
          </motion.div>
        )}
      </div>
    </main>
  )
}

