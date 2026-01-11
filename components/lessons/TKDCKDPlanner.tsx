'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, RefreshCw, Calendar, Zap, AlertCircle, CheckCircle2, Info } from 'lucide-react'

type ProtocolType = 'skd' | 'tkd' | 'ckd' | null

interface ProtocolRecommendation {
  type: ProtocolType
  title: string
  description: string
  recommendation: string
  carbsInfo?: string
  scheduleInfo?: string
}

export function TKDCKDPlanner() {
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number>(3)
  const [workoutIntensity, setWorkoutIntensity] = useState<'low' | 'medium' | 'high'>('medium')
  const [workoutType, setWorkoutType] = useState<'cardio' | 'strength' | 'hiit' | 'mixed'>('mixed')
  const [ketoExperience, setKetoExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [recommendation, setRecommendation] = useState<ProtocolRecommendation | null>(null)

  const calculateRecommendation = () => {
    let recommendedType: ProtocolType = 'skd'
    let title = 'Стандартное Кето (SKD)'
    let description = 'Оставайтесь на стандартном кето. Это лучший выбор для большинства людей.'
    let recommendationText = 'Продолжайте строгое кето с 20-30г углеводов в день. Добавление углеводов не требуется.'
    let carbsInfo = ''
    let scheduleInfo = ''

    // Логика выбора протокола
    if (ketoExperience === 'beginner') {
      recommendedType = 'skd'
      title = 'Стандартное Кето (SKD)'
      description = 'Рекомендуется оставаться на стандартном кето минимум 2-3 месяца для полной адаптации.'
      recommendationText = 'Сначала адаптируйтесь к строгому кето (20-30г углеводов в день). Только после 2-3 месяцев адаптации можно рассмотреть TKD или CKD.'
      scheduleInfo = '7 дней в неделю: строгое кето (менее 30г углеводов)'
    } else if (workoutsPerWeek >= 5 && workoutIntensity === 'high' && ketoExperience === 'advanced') {
      // CKD для очень активных
      if (workoutIntensity === 'high' && workoutType === 'hiit') {
        recommendedType = 'ckd'
        title = 'Циклическое Кето (CKD)'
        description = 'Подходит для очень активных спортсменов с опытом кето.'
        recommendationText = '5-6 дней строгого кето + 1-2 дня углеводной загрузки. Пополняет мышечный гликоген для высокоинтенсивных тренировок.'
        carbsInfo = 'Дни загрузки: 400-600г углеводов (рис, картофель, овсянка, фрукты). Не мусорная еда!'
        scheduleInfo = 'Пн-Пт: строгое кето (<30г У)\nСб-Вс: углеводная загрузка (400-600г У)'
      } else {
        recommendedType = 'tkd'
        title = 'Целевое Кето (TKD)'
        description = 'Добавляйте быстрые углеводы перед высокоинтенсивными тренировками.'
        recommendationText = '20-50г быстрых углеводов за 15-30 минут до тренировки. Эти углеводы сгорят во время тренировки, кетоз восстановится за 1-2 часа.'
        carbsInfo = 'Рекомендуемые продукты: декстроза/глюкоза (20-30г), мед (1-2 ст.л.), финики (2-3 шт). НЕ фрукты (фруктоза идет в печень)!'
        scheduleInfo = `Дни тренировок: ${workoutsPerWeek} раз в неделю за 30 мин до тренировки - 20-50г быстрых углеводов\nДни отдыха: строгое кето (<30г У)`
      }
    } else if (workoutsPerWeek >= 4 && workoutIntensity !== 'low') {
      // TKD для активных
      recommendedType = 'tkd'
      title = 'Целевое Кето (TKD)'
      description = 'Идеально для активных тренировок 4+ раз в неделю.'
      recommendationText = 'Добавляйте 20-40г быстрых углеводов за 30 минут до тренировки. Это даст дополнительную энергию без нарушения кетоза надолго.'
      
      const carbsAmount = workoutIntensity === 'high' ? '30-50г' : workoutType === 'hiit' ? '25-40г' : '20-30г'
      carbsInfo = `Рекомендуемые углеводы: ${carbsAmount} быстрых углеводов (декстроза, мед, финики). Только за 30 мин до тренировки!`
      scheduleInfo = `Дни тренировок: ${workoutsPerWeek} раз в неделю за 30 мин до тренировки - ${carbsAmount} быстрых углеводов\nДни отдыха: строгое кето (<30г У)`
    } else {
      recommendedType = 'skd'
      title = 'Стандартное Кето (SKD)'
      description = 'Оставайтесь на стандартном кето. Это оптимальный выбор для вашего уровня активности.'
      recommendationText = 'Продолжайте строгое кето с 20-30г углеводов в день. При вашей активности дополнительные углеводы не нужны.'
      scheduleInfo = '7 дней в неделю: строгое кето (менее 30г углеводов)'
    }

    setRecommendation({
      type: recommendedType,
      title,
      description,
      recommendation: recommendationText,
      carbsInfo,
      scheduleInfo
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-electric/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-electric/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-teal flex items-center justify-center flex-shrink-0">
          <Target className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Планировщик TKD/CKD</h3>
          <p className="text-white/60 text-xs sm:text-sm">Определите оптимальный кето-протокол для вашей активности</p>
        </div>
      </div>

      {/* Параметры */}
      <div className="space-y-4 mb-6">
        {/* Опыт кето */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-sm font-medium mb-3 block">Опыт на кето-диете:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'beginner', label: 'Начинающий', desc: '< 2 месяцев' },
              { value: 'intermediate', label: 'Средний', desc: '2-6 месяцев' },
              { value: 'advanced', label: 'Опытный', desc: '> 6 месяцев' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setKetoExperience(option.value as any)}
                className={`py-3 px-3 rounded-xl text-xs font-medium transition-all ${
                  ketoExperience === option.value
                    ? 'bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs opacity-80 mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Количество тренировок */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-sm font-medium mb-3 block">Количество тренировок в неделю:</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="7"
              value={workoutsPerWeek}
              onChange={(e) => setWorkoutsPerWeek(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-16 text-center py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold">
              {workoutsPerWeek}
            </div>
          </div>
        </div>

        {/* Тип тренировок */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-sm font-medium mb-3 block">Тип тренировок:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 'cardio', label: 'Кардио' },
              { value: 'strength', label: 'Силовые' },
              { value: 'hiit', label: 'HIIT' },
              { value: 'mixed', label: 'Смешанные' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setWorkoutType(option.value as any)}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  workoutType === option.value
                    ? 'bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Интенсивность */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-sm font-medium mb-3 block">Интенсивность тренировок:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low', label: 'Низкая' },
              { value: 'medium', label: 'Средняя' },
              { value: 'high', label: 'Высокая' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setWorkoutIntensity(option.value as any)}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  workoutIntensity === option.value
                    ? 'bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Кнопка расчета */}
      <button
        onClick={calculateRecommendation}
        className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-electric/30 transition-all flex items-center justify-center gap-2"
      >
        <Zap className="w-5 h-5" />
        <span>Рассчитать рекомендацию</span>
      </button>

      {/* Результат */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-gradient-to-br from-accent-electric/20 to-accent-teal/20 border-2 border-accent-electric/50"
        >
          <div className="flex items-start gap-3 mb-4">
            <Target className="w-6 h-6 text-accent-electric flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-xl font-bold text-white mb-2">{recommendation.title}</h4>
              <p className="text-white/80 text-sm mb-4">{recommendation.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-white font-semibold mb-2">Рекомендация:</div>
                  <p className="text-white/80 text-sm leading-relaxed">{recommendation.recommendation}</p>
                </div>
              </div>
            </div>

            {recommendation.carbsInfo && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-5 h-5 text-accent-electric flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-2">Информация об углеводах:</div>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{recommendation.carbsInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {recommendation.scheduleInfo && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-2">Расписание:</div>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{recommendation.scheduleInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {recommendation.type === 'ckd' && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-yellow-400 font-semibold mb-2">⚠️ Важно для CKD:</div>
                    <ul className="text-yellow-300/80 text-sm space-y-1 list-disc list-inside">
                      <li>Углеводная загрузка должна быть "чистой" - рис, картофель, овсянка, фрукты</li>
                      <li>Избегайте мусорной еды (фастфуд, сладости, выпечка)</li>
                      <li>Минимизируйте жиры в дни загрузки</li>
                      <li>Добавьте белок (1.5-2г на кг веса)</li>
                      <li>Вернуться в кетоз может занять 1-2 дня</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {recommendation.type === 'tkd' && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-blue-400 font-semibold mb-2">💡 Советы для TKD:</div>
                    <ul className="text-blue-300/80 text-sm space-y-1 list-disc list-inside">
                      <li>Принимайте углеводы за 15-30 минут ДО тренировки</li>
                      <li>Используйте декстрозу или мед (быстрые углеводы)</li>
                      <li>НЕ используйте фрукты - фруктоза идет в печень, а не в мышцы</li>
                      <li>Эти углеводы должны "сгореть" на тренировке</li>
                      <li>Кетоз восстановится через 1-2 часа после тренировки</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {recommendation.type === 'skd' && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-green-400 font-semibold mb-2">✅ Стандартное кето - оптимальный выбор:</div>
                    <ul className="text-green-300/80 text-sm space-y-1 list-disc list-inside">
                      <li>20-30г углеводов в день</li>
                      <li>Подходит для 90% людей</li>
                      <li>Максимальное жиросжигание</li>
                      <li>Стабильный кетоз</li>
                      <li>Простота соблюдения</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

