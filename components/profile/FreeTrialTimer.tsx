'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, Zap } from 'lucide-react'
import Link from 'next/link'

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

export function FreeTrialTimer({ freeTrial }: FreeTrialTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    totalSeconds: number
  } | null>(null)
  const [progressPercent, setProgressPercent] = useState(100)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!freeTrial || !freeTrial.isActive) {
      setTimeRemaining(null)
      return
    }

    const startMs = new Date(freeTrial.startedAt).getTime()
    const endMs = new Date(freeTrial.expiresAt).getTime()
    const totalDuration = endMs - startMs

    const updateTimer = () => {
      const now = Date.now()
      const difference = endMs - now

      if (difference <= 0) {
        setTimeRemaining(null)
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      const totalSeconds = Math.floor(difference / 1000)

      setTimeRemaining({ days, hours, minutes, seconds, totalSeconds })

      // Прогресс-бар: сколько % времени осталось
      const elapsed = now - startMs
      const percent = Math.max(0, Math.min(100, ((totalDuration - elapsed) / totalDuration) * 100))
      setProgressPercent(percent)
    }

    updateTimer()
    intervalRef.current = setInterval(updateTimer, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [freeTrial])

  if (!freeTrial || !freeTrial.isActive || !timeRemaining) {
    return null
  }

  // Цвет прогресс-бара в зависимости от оставшегося времени
  const progressColor =
    progressPercent > 50
      ? 'from-[#00ff88] to-[#00d4ff]'
      : progressPercent > 20
      ? 'from-[#ffd700] to-[#ff8c42]'
      : 'from-[#ff4444] to-[#ff8c42]'

  const urgencyText =
    progressPercent > 50
      ? 'Бесплатный доступ активен'
      : progressPercent > 20
      ? 'Время заканчивается!'
      : 'Осталось совсем мало!'

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#ffd700]/30 bg-gradient-to-br from-[#1a1a1a] to-[#111]">
      {/* Фоновое свечение */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background:
            progressPercent > 50
              ? 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.4), transparent 70%)'
              : progressPercent > 20
              ? 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.4), transparent 70%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(255,68,68,0.4), transparent 70%)',
        }}
      />

      <div className="relative z-10 p-5 md:p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ffd700]/15 border border-[#ffd700]/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#ffd700]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">{urgencyText}</p>
              <p className="text-white/40 text-xs mt-0.5">7-дневный бесплатный доступ</p>
            </div>
          </div>
          <Link
            href="/apps"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/20 transition-colors"
          >
            Открыть →
          </Link>
        </div>

        {/* Таймер — 4 блока */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { value: timeRemaining.days, label: 'дней' },
            { value: timeRemaining.hours, label: 'часов' },
            { value: timeRemaining.minutes, label: 'минут' },
            { value: timeRemaining.seconds, label: 'секунд' },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]"
            >
              <span
                className="font-black text-2xl md:text-3xl tabular-nums leading-none"
                style={{
                  background:
                    progressPercent > 50
                      ? 'linear-gradient(135deg, #00ff88, #00d4ff)'
                      : progressPercent > 20
                      ? 'linear-gradient(135deg, #ffd700, #ff8c42)'
                      : 'linear-gradient(135deg, #ff4444, #ff8c42)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {String(value).padStart(2, '0')}
              </span>
              <span className="text-white/40 text-[10px] mt-1 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>

        {/* Прогресс-бар */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/40 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Прогресс доступа
            </span>
            <span className="text-white/40 text-xs">{Math.round(progressPercent)}% осталось</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Доступные приложения */}
        {freeTrial.apps && freeTrial.apps.length > 0 && (
          <div>
            <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Доступно:</p>
            <div className="flex flex-wrap gap-1.5">
              {freeTrial.apps.map((appId) => (
                <span
                  key={appId}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs font-medium"
                >
                  {appNames[appId] || appId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
