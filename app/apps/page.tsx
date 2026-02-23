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

// Мини-таймер для страницы приложений
function FreeTrialBanner({ expiresAt, allowedCount }: { expiresAt: string; allowedCount: number }) {
  const [time, setTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTime(null); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!time) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#ffd700]/15 border border-[#ffd700]/30 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-[#ffd700]" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">Бесплатный доступ активен</p>
          <p className="text-white/40 text-xs mt-0.5">Доступно {allowedCount} приложений · Остальные — после покупки курса</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {[
          { v: time.days, l: 'дн' },
          { v: time.hours, l: 'ч' },
          { v: time.minutes, l: 'мин' },
          { v: time.seconds, l: 'сек' },
        ].map(({ v, l }) => (
          <div key={l} className="flex flex-col items-center min-w-[44px] py-2 px-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <span className="font-black text-lg tabular-nums leading-none" style={{
              background: 'linear-gradient(135deg, #ffd700, #ff8c42)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              {String(v).padStart(2, '0')}
            </span>
            <span className="text-white/30 text-[9px] mt-0.5 uppercase tracking-wider">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AppsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | App['category']>('all')
  // null = ещё не загружено, [] = нет ограничений (полный доступ), [...] = список разрешённых
  const [allowedApps, setAllowedApps] = useState<string[] | null>(null)
  const [freeTrial, setFreeTrial] = useState<{ isActive: boolean; expiresAt: string; daysRemaining: number } | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/login')
        return
      }

      // Если пользователь админ - сразу даём полный доступ
      if (user.is_admin) {
        setHasAccess(true)
        setAllowedApps([]) // пустой массив = нет ограничений
        setIsCheckingAccess(false)
        return
      }

      try {
        const response = await fetch('/api/courses/access?check_purchased=true', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()

          const hasFull = data.hasPurchased === true || data.isAdmin === true
          const hasTrialAccess = data.hasFreeTrial === true && data.isFreeTrialActive === true

          if (hasFull) {
            // Полный доступ — все приложения
            setHasAccess(true)
            setAllowedApps([])
          } else if (hasTrialAccess) {
            // Бесплатный доступ — грузим список разрешённых приложений
            setHasAccess(true)
            const trialResp = await fetch('/api/access/free-trial', { credentials: 'include' })
            if (trialResp.ok) {
              const trialData = await trialResp.json()
              setAllowedApps(trialData.apps || [])
              setFreeTrial({
                isActive: trialData.isActive,
                expiresAt: trialData.expiresAt,
                daysRemaining: trialData.daysRemaining,
              })
            } else {
              setAllowedApps([])
            }
          } else {
            setHasAccess(false)
            setAllowedApps(null)
          }
        } else {
          setHasAccess(false)
        }
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [user, authLoading, router])

  // Проверяем, доступно ли конкретное приложение
  const isAppAllowed = (appId: string): boolean => {
    if (!allowedApps) return false
    if (allowedApps.length === 0) return true // полный доступ
    // workout-generator не входит в free_trial_apps — всегда требует покупки
    if (appId === 'workout-generator') return allowedApps.length === 0
    return allowedApps.includes(appId)
  }

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
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Мои приложения
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Все инструменты для достижения ваших целей в одном месте
          </p>
        </motion.div>

        {/* Баннер бесплатного доступа с таймером */}
        {freeTrial && freeTrial.isActive && allowedApps && allowedApps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 rounded-2xl border border-[#ffd700]/30 bg-gradient-to-br from-[#1a1a1a] to-[#111] overflow-hidden"
          >
            <FreeTrialBanner expiresAt={freeTrial.expiresAt} allowedCount={allowedApps.length} />
          </motion.div>
        )}

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
          {filteredApps.map((app, index) => {
            const allowed = isAppAllowed(app.id)
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {allowed ? (
                  <Link href={app.href}>
                    <motion.div
                      className="card p-6 h-full flex flex-col hover:border-accent-electric/50 transition-all group cursor-pointer relative overflow-hidden"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      {app.badge && (
                        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 text-xs font-bold">
                          {app.badge}
                        </div>
                      )}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                        {app.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 relative z-10">{app.title}</h3>
                      <p className="text-white/60 text-sm mb-4 flex-grow relative z-10">{app.description}</p>
                      <div className="flex items-center text-accent-electric relative z-10 group-hover:translate-x-2 transition-transform">
                        <span className="text-sm font-medium">Открыть</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </motion.div>
                  </Link>
                ) : (
                  <Link href="/courses">
                    <motion.div
                      className="card p-6 h-full flex flex-col relative overflow-hidden opacity-50 cursor-pointer group"
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Замок-оверлей */}
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-900/60 backdrop-blur-[2px] rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                          <Lock className="w-6 h-6 text-white/60" />
                        </div>
                        <span className="text-white/60 text-xs font-medium text-center px-4">Доступно после покупки курса</span>
                      </div>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white mb-4 opacity-40`}>
                        {app.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white/40 mb-2">{app.title}</h3>
                      <p className="text-white/30 text-sm mb-4 flex-grow">{app.description}</p>
                      <div className="flex items-center text-white/20">
                        <span className="text-sm font-medium">Купить курс</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </motion.div>
                  </Link>
                )}
              </motion.div>
            )
          })}
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

