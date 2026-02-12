'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Gift, Sparkles } from 'lucide-react'

interface FreeTrialTimerProps {
  freeTrial: {
    enabled: boolean
    isActive: boolean
    daysRemaining: number
    hoursRemaining: number
    startedAt: string
    expiresAt: string
    apps: string[]
  } | null
}

export function FreeTrialTimer({ freeTrial }: FreeTrialTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    if (!freeTrial || !freeTrial.isActive) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiresAt = new Date(freeTrial.expiresAt).getTime()
      const difference = expiresAt - now

      if (difference <= 0) {
        setTimeRemaining(null)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [freeTrial])

  if (!freeTrial || !freeTrial.isActive) {
    return null
  }

  const appNames: Record<string, string> = {
    'menu-generator': 'Личный шеф',
    'macro-calculator': 'Калькулятор макросов',
    'if-calculator': 'Калькулятор IF',
    'keto-flu-calculator': 'Калькулятор кетогриппа',
    'shopping-list': 'Список покупок',
    'recipe-generator': 'Генератор рецептов',
    'hunger-tracker': 'Трекер голода',
    'if-progress-tracker': 'Трекер прогресса IF',
    'progress-notes': 'Заметки о прогрессе',
    'fasting-workout': 'Тренировки на голоде'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass border-2 border-accent-gold/50 bg-gradient-to-br from-accent-gold/10 via-accent-flame/10 to-accent-gold/10 p-6 mb-6 relative overflow-hidden"
    >
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 via-accent-flame/5 to-accent-gold/5 animate-pulse" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-flame/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-flame flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.5)]">
            <Gift className="w-6 h-6 text-dark-900" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-gold" />
              Бесплатный доступ активен!
            </h3>
            <p className="text-sm text-white/60">Используйте приложения без ограничений</p>
          </div>
        </div>

        {/* Таймер */}
        {timeRemaining && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-accent-gold" />
              <span className="text-sm text-white/70 font-medium">Осталось времени:</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-3 rounded-lg bg-dark-800/50 border border-accent-gold/30">
                <div className="text-2xl font-black text-accent-gold">{timeRemaining.days}</div>
                <div className="text-xs text-white/50 mt-1">дней</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-dark-800/50 border border-accent-gold/30">
                <div className="text-2xl font-black text-accent-gold">{String(timeRemaining.hours).padStart(2, '0')}</div>
                <div className="text-xs text-white/50 mt-1">часов</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-dark-800/50 border border-accent-gold/30">
                <div className="text-2xl font-black text-accent-gold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                <div className="text-xs text-white/50 mt-1">минут</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-dark-800/50 border border-accent-gold/30">
                <div className="text-2xl font-black text-accent-gold animate-pulse">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                <div className="text-xs text-white/50 mt-1">секунд</div>
              </div>
            </div>
          </div>
        )}

        {/* Доступные приложения */}
        {freeTrial.apps && freeTrial.apps.length > 0 && (
          <div>
            <p className="text-sm text-white/70 mb-2 font-medium">Доступные приложения:</p>
            <div className="flex flex-wrap gap-2">
              {freeTrial.apps.map((appId) => (
                <span
                  key={appId}
                  className="px-3 py-1 rounded-full bg-accent-gold/20 text-accent-gold text-xs font-medium border border-accent-gold/30"
                >
                  {appNames[appId] || appId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

