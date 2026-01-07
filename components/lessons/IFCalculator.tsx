'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Timer, Coffee, UtensilsCrossed, TrendingUp } from 'lucide-react'

interface IFWindow {
  start: string
  end: string
  type: 'fasting' | 'eating'
}

const IF_PATTERNS = {
  '16:8': { fast: 16, eat: 8, description: 'Самый популярный. Голодание 16 часов, окно питания 8 часов' },
  '18:6': { fast: 18, eat: 6, description: 'Более строгий вариант. Голодание 18 часов, окно питания 6 часов' },
  '20:4': { fast: 20, eat: 4, description: 'Продвинутый вариант. Голодание 20 часов, окно питания 4 часа' },
  '14:10': { fast: 14, eat: 10, description: 'Для начинающих. Голодание 14 часов, окно питания 10 часов' },
  '12:12': { fast: 12, eat: 12, description: 'Мягкий старт. Голодание 12 часов, окно питания 12 часов' },
}

export function IFCalculator() {
  const [pattern, setPattern] = useState<keyof typeof IF_PATTERNS>('16:8')
  const [wakeUpTime, setWakeUpTime] = useState('07:00')
  const [schedule, setSchedule] = useState<IFWindow[]>([])

  const calculateSchedule = () => {
    const [wakeHour, wakeMinute] = wakeUpTime.split(':').map(Number)
    const wakeUp = new Date()
    wakeUp.setHours(wakeHour, wakeMinute, 0, 0)
    
    const { fast, eat } = IF_PATTERNS[pattern]
    const fastStart = new Date(wakeUp)
    fastStart.setHours(fastStart.getHours() - fast)
    
    const eatStart = new Date(wakeUp)
    const eatEnd = new Date(eatStart)
    eatEnd.setHours(eatEnd.getHours() + eat)
    
    const fastEnd = new Date(eatEnd)
    const fastEndNext = new Date(fastEnd)
    fastEndNext.setHours(fastEndNext.getHours() + fast)
    
    const windows: IFWindow[] = [
      { start: formatTime(fastStart), end: formatTime(eatStart), type: 'fasting' },
      { start: formatTime(eatStart), end: formatTime(eatEnd), type: 'eating' },
      { start: formatTime(eatEnd), end: formatTime(fastEndNext), type: 'fasting' },
    ]
    
    setSchedule(windows)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const getBenefits = () => {
    const benefits: Record<string, string[]> = {
      '12:12': ['Улучшение пищеварения', 'Стабилизация уровня сахара в крови'],
      '14:10': ['Легкое снижение веса', 'Улучшение метаболизма', 'Снижение воспалений'],
      '16:8': ['Активация аутофагии', 'Сжигание жира', 'Улучшение когнитивных функций', 'Долголетие'],
      '18:6': ['Более глубокая аутофагия', 'Ускоренное жиросжигание', 'Повышение энергии', 'Меньше тяги к еде'],
      '20:4': ['Максимальная аутофагия', 'Сильное жиросжигание', 'Ментальная ясность', 'Детокс'],
    }
    return benefits[pattern] || []
  }

  const getRecommendations = () => {
    const recommendations: Record<string, string[]> = {
      '12:12': ['Идеально для начинающих', 'Можно пить воду, чай, кофе без сахара в период голодания'],
      '14:10': ['Отлично для адаптации', 'Старайтесь завтракать позже', 'Ужинайте раньше'],
      '16:8': ['Самый популярный и эффективный', 'Завтракайте в 12:00, ужинайте в 20:00', 'Пейте много воды'],
      '18:6': ['Для продвинутых', 'Можно объединить с кето', 'Следите за электролитами'],
      '20:4': ['Только для опытных', 'Обязательно следите за самочувствием', 'Проконсультируйтесь с врачом'],
    }
    return recommendations[pattern] || []
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-dark-800/50 to-pink-500/10 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Timer className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Калькулятор интервального голодания</h3>
          <p className="text-white/60 text-sm">Рассчитайте персональное расписание IF</p>
        </div>
      </div>

      {/* Выбор паттерна */}
      <div className="mb-6">
        <label className="block text-white/80 text-sm font-medium mb-2">Выберите паттерн IF:</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {Object.entries(IF_PATTERNS).map(([key, { description }]) => (
            <button
              key={key}
              onClick={() => setPattern(key as keyof typeof IF_PATTERNS)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                pattern === key
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <div className="font-bold text-lg mb-1">{key}</div>
              <div className="text-xs">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Время пробуждения */}
      <div className="mb-6">
        <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Время пробуждения
        </label>
        <input
          type="time"
          value={wakeUpTime}
          onChange={(e) => setWakeUpTime(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      <button
        onClick={calculateSchedule}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all mb-6"
      >
        Рассчитать расписание
      </button>

      {/* Расписание */}
      {schedule.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 mb-6"
        >
          <div className="p-4 rounded-xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border-2 border-purple-500/30">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-purple-400" />
              Ваше расписание на день
            </h4>
            <div className="space-y-3">
              {schedule.map((window, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    window.type === 'eating'
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50'
                      : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {window.type === 'eating' ? (
                        <UtensilsCrossed className="w-5 h-5 text-green-400" />
                      ) : (
                        <Coffee className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="font-bold text-white">
                        {window.type === 'eating' ? 'Окно питания' : 'Период голодания'}
                      </span>
                    </div>
                    <span className="text-white/60 text-sm">
                      {window.start} - {window.end}
                    </span>
                  </div>
                  <div className="text-white/60 text-sm">
                    {window.type === 'eating' 
                      ? 'В этот период вы можете есть. Старайтесь есть сытную, питательную пищу.'
                      : 'В этот период только вода, чай, кофе без сахара. Никакой еды!'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Преимущества */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-br from-accent-mint/20 to-accent-teal/20 border-2 border-accent-mint/30 mb-4"
      >
        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-mint" />
          Преимущества паттерна {pattern}:
        </h4>
        <ul className="space-y-1">
          {getBenefits().map((benefit, index) => (
            <li key={index} className="text-white/80 text-sm flex items-start gap-2">
              <span className="text-accent-mint mt-0.5">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Рекомендации */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <h4 className="text-white font-semibold mb-2">Рекомендации:</h4>
        <ul className="space-y-1">
          {getRecommendations().map((rec, index) => (
            <li key={index} className="text-white/60 text-sm flex items-start gap-2">
              <span className="text-white/40 mt-0.5">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  )
}

