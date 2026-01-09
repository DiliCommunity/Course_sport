'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dumbbell, Calendar, AlertTriangle, Download, Shuffle, Clock, Activity, TrendingUp, Heart } from 'lucide-react'
import { jsPDF } from 'jspdf'

type Chronotype = 'early' | 'normal' | 'late' // Жаворонок, Голубь, Сова
type IFWeek = 1 | 2 | 3 | 4 | 5 // Неделя IF
type IFProtocol = '16/8' | '18/6' | '20/4' | 'OMAD' // Протокол IF

interface Workout {
  id: string
  day: string
  time: string
  type: string
  duration: number
  intensity: 'low' | 'medium' | 'high'
  exercises: string[]
  notes: string
  ifStatus: 'fasting' | 'fed' // Натощак или после еды
}

const CHRONOTYPE_INFO = {
  early: {
    name: 'Жаворонок',
    description: 'Просыпаетесь рано (5-7 утра), пик активности утром',
    workoutTimes: ['6:00-7:00', '7:00-8:00', '8:00-9:00'],
  },
  normal: {
    name: 'Голубь',
    description: 'Средний режим (7-8 утра), равномерная активность в течение дня',
    workoutTimes: ['7:00-8:00', '8:00-9:00', '12:00-13:00'],
  },
  late: {
    name: 'Сова',
    description: 'Поздно ложитесь (после 23:00), пик активности вечером',
    workoutTimes: ['9:00-10:00', '10:00-11:00', '18:00-19:00'],
  },
}

const WORKOUT_TYPES = {
  cardio: {
    name: 'Кардио',
    exercises: ['Ходьба 30-45 мин', 'Бег трусцой 20-30 мин', 'Велосипед 30-40 мин', 'Эллипс 25-35 мин', 'Плавание 20-30 мин'],
    intensity: ['low', 'medium'] as const,
  },
  strength: {
    name: 'Силовые',
    exercises: ['Приседания 3x12', 'Отжимания 3x10', 'Планка 3x30 сек', 'Выпады 3x10', 'Подтягивания 3x8', 'Тяга 3x10'],
    intensity: ['medium', 'high'] as const,
  },
  hiit: {
    name: 'HIIT',
    exercises: ['Бёрпи 30 сек / отдых 30 сек x5', 'Прыжки 30 сек / отдых 30 сек x5', 'Спринт 20 сек / отдых 40 сек x6', 'Табата 20/10 x8'],
    intensity: ['high'] as const,
  },
  yoga: {
    name: 'Йога/Растяжка',
    exercises: ['Хатха йога 30-40 мин', 'Виньяса флоу 25-35 мин', 'Растяжка 20-30 мин', 'Йога для восстановления 30 мин'],
    intensity: ['low'] as const,
  },
  mixed: {
    name: 'Смешанная',
    exercises: ['Разминка 5 мин + Силовая 15 мин + Кардио 15 мин', 'Воркаут 20 мин + Растяжка 10 мин', 'Круговая тренировка 25-30 мин'],
    intensity: ['medium'] as const,
  },
}

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

export function FastingWorkoutGenerator() {
  const [chronotype, setChronotype] = useState<Chronotype>('normal')
  const [ifWeek, setIfWeek] = useState<IFWeek>(1)
  const [ifProtocol, setIfProtocol] = useState<IFProtocol>('16/8')
  const [generatedWorkouts, setGeneratedWorkouts] = useState<Workout[]>([])
  const [downloading, setDownloading] = useState(false)

  const getIFWindow = (protocol: IFProtocol) => {
    switch (protocol) {
      case '16/8':
        return { start: '12:00', end: '20:00' }
      case '18/6':
        return { start: '13:00', end: '19:00' }
      case '20/4':
        return { start: '14:00', end: '18:00' }
      case 'OMAD':
        return { start: '15:00', end: '16:00' }
    }
  }

  const isFastingTime = (time: string, protocol: IFProtocol, chrono: Chronotype) => {
    const ifWindow = getIFWindow(protocol)
    const timeHour = parseInt(time.split(':')[0])
    const windowStart = parseInt(ifWindow.start.split(':')[0])
    const windowEnd = parseInt(ifWindow.end.split(':')[0])

    // Для жаворонков тренировка раньше, скорее всего натощак
    if (chrono === 'early') {
      return timeHour < windowStart
    }
    // Для сов тренировка может быть вечером, после окна
    if (chrono === 'late' && timeHour >= 18) {
      return timeHour >= windowEnd
    }
    // Для голубей - утренние тренировки натощак
    return timeHour < windowStart
  }

  const getWorkoutIntensity = (week: IFWeek, type: string): 'low' | 'medium' | 'high' => {
    // На первых неделях IF интенсивность ниже
    if (week === 1) return 'low'
    if (week === 2) return type === 'hiit' ? 'medium' : 'low'
    if (week === 3) return 'medium'
    if (week >= 4) return type === 'hiit' ? 'high' : 'medium'
    return 'medium'
  }

  const getWorkoutDuration = (week: IFWeek, type: string): number => {
    if (week === 1) {
      return type === 'yoga' ? 30 : type === 'cardio' ? 25 : 20
    }
    if (week === 2) {
      return type === 'yoga' ? 35 : type === 'cardio' ? 30 : 25
    }
    if (week >= 3) {
      return type === 'yoga' ? 40 : type === 'cardio' ? 40 : 30
    }
    return 30
  }

  const generateWorkoutPlan = () => {
    const workouts: Workout[] = []
    const ifWindow = getIFWindow(ifProtocol)
    const chronoInfo = CHRONOTYPE_INFO[chronotype]
    
    // Определяем типы тренировок на неделю
    const weekPlan = [
      { day: 'Понедельник', type: 'cardio', time: chronoInfo.workoutTimes[0] },
      { day: 'Вторник', type: 'strength', time: chronoInfo.workoutTimes[0] },
      { day: 'Среда', type: 'yoga', time: chronoInfo.workoutTimes[1] },
      { day: 'Четверг', type: 'mixed', time: chronoInfo.workoutTimes[0] },
      { day: 'Пятница', type: 'cardio', time: chronoInfo.workoutTimes[1] },
      { day: 'Суббота', type: ifWeek >= 3 ? 'hiit' : 'strength', time: chronoInfo.workoutTimes[0] },
      { day: 'Воскресенье', type: 'yoga', time: chronoInfo.workoutTimes[2] || chronoInfo.workoutTimes[0] },
    ]

    weekPlan.forEach((dayPlan, index) => {
      const workoutType = WORKOUT_TYPES[dayPlan.type as keyof typeof WORKOUT_TYPES]
      const timeHour = parseInt(dayPlan.time.split('-')[0].split(':')[0])
      const isFasting = isFastingTime(`${timeHour}:00`, ifProtocol, chronotype)
      const intensity = getWorkoutIntensity(ifWeek, dayPlan.type)
      const duration = getWorkoutDuration(ifWeek, dayPlan.type)
      
      // Выбираем упражнения в зависимости от интенсивности
      const availableExercises = workoutType.exercises.filter((_, i) => {
        const exIntensity = workoutType.intensity[i % workoutType.intensity.length] as 'low' | 'medium' | 'high'
        return exIntensity === intensity
      })

      const selectedExercises = availableExercises.slice(0, Math.min(4, availableExercises.length))

      let notes = ''
      if (isFasting) {
        notes = `⚠️ Тренировка натощак. Пейте воду до и во время тренировки. При головокружении - остановитесь.`
        if (ifWeek === 1) {
          notes += ' Первая неделя IF - снизьте интенсивность при необходимости.'
        }
      } else {
        notes = `Тренировка после еды. Подождите 1-2 часа после приема пищи.`
      }

      if (intensity === 'high' && ifWeek < 3) {
        notes += ' Высокая интенсивность только при хорошем самочувствии.'
      }

      workouts.push({
        id: `workout-${index}`,
        day: dayPlan.day,
        time: dayPlan.time,
        type: workoutType.name,
        duration,
        intensity,
        exercises: selectedExercises,
        notes,
        ifStatus: isFasting ? 'fasting' : 'fed',
      })
    })

    setGeneratedWorkouts(workouts)
  }

  const downloadPDF = async () => {
    if (generatedWorkouts.length === 0) {
      alert('Сначала сгенерируйте план тренировок!')
      return
    }

    try {
      setDownloading(true)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      let yPos = 25

      // Заголовок
      pdf.setFontSize(24)
      pdf.setTextColor(59, 130, 246)
      pdf.text('План тренировок натощак', pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Хронотип: ${CHRONOTYPE_INFO[chronotype].name} | Неделя IF: ${ifWeek} | Протокол: ${ifProtocol}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      // Важное предупреждение
      pdf.setFontSize(10)
      pdf.setTextColor(200, 0, 0)
      pdf.text('⚠️ ВАЖНО: Проконсультируйтесь с врачом перед началом тренировок натощак!', margin, yPos)
      yPos += 8
      pdf.setTextColor(0, 0, 0)
      pdf.text('Тренировки натощак подходят не всем. При хронических заболеваниях, беременности,', margin, yPos)
      yPos += 5
      pdf.text('диабете, проблемах с сердцем или давлением обязательна консультация специалиста.', margin, yPos)
      yPos += 10

      // Тренировки
      generatedWorkouts.forEach((workout, index) => {
        if (yPos > pageHeight - 80) {
          pdf.addPage()
          yPos = 25
        }

        pdf.setFontSize(16)
        pdf.setTextColor(59, 130, 246)
        pdf.text(`${index + 1}. ${workout.day} - ${workout.time}`, margin, yPos)
        yPos += 8

        pdf.setFontSize(10)
        pdf.setTextColor(0, 0, 0)
        const statusText = workout.ifStatus === 'fasting' ? 'Натощак ⚠️' : 'После еды'
        const intensityText = workout.intensity === 'low' ? 'Низкая' : workout.intensity === 'medium' ? 'Средняя' : 'Высокая'
        pdf.text(`Тип: ${workout.type} | ${statusText} | Интенсивность: ${intensityText} | Длительность: ${workout.duration} мин`, margin, yPos)
        yPos += 6

        pdf.setFontSize(11)
        pdf.setTextColor(59, 130, 246)
        pdf.text('Упражнения:', margin, yPos)
        yPos += 6

        pdf.setFontSize(9)
        pdf.setTextColor(0, 0, 0)
        workout.exercises.forEach(exercise => {
          pdf.text(`• ${exercise}`, margin + 5, yPos)
          yPos += 5
        })
        yPos += 3

        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        const noteLines = pdf.splitTextToSize(workout.notes, pageWidth - 2 * margin)
        pdf.text(noteLines, margin, yPos)
        yPos += noteLines.length * 5 + 5
      })

      const fileName = `Тренировки-натощак-${CHRONOTYPE_INFO[chronotype].name}-${ifWeek}нед-${ifProtocol}-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    }
  }

  useEffect(() => {
    // Сохраняем в localStorage
    if (generatedWorkouts.length > 0) {
      localStorage.setItem('fasting-workout-plan', JSON.stringify({
        chronotype,
        ifWeek,
        ifProtocol,
        workouts: generatedWorkouts,
        generatedAt: new Date().toISOString()
      }))
    }
  }, [generatedWorkouts, chronotype, ifWeek, ifProtocol])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-dark-800/50 to-red-500/10 border-2 border-orange-500/30 shadow-[0_0_30px_rgba(255,107,53,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Планировщик тренировок натощак</h3>
          <p className="text-white/60 text-xs sm:text-sm">Персональный план тренировок с учетом вашего хронотипа и протокола IF</p>
        </div>
      </div>

      {/* Важное предупреждение */}
      <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm mb-2">⚠️ Важно: Консультация с врачом обязательна!</h4>
            <p className="text-white/80 text-xs leading-relaxed mb-2">
              Тренировки натощак подходят не всем. <strong>Проконсультируйтесь с врачом</strong> перед началом, особенно если у вас есть:
            </p>
            <ul className="text-white/70 text-xs space-y-1 ml-4 list-disc">
              <li>Хронические заболевания (диабет, проблемы с сердцем, почками, печенью)</li>
              <li>Беременность или кормление грудью</li>
              <li>Низкое или высокое артериальное давление</li>
              <li>Проблемы с метаболизмом</li>
              <li>Травмы или операции в последние 6 месяцев</li>
            </ul>
            <p className="text-white/80 text-xs leading-relaxed mt-2">
              При головокружении, тошноте, слабости во время тренировки натощак — <strong>немедленно остановитесь</strong> и съешьте что-то легкое.
            </p>
          </div>
        </div>
      </div>

      {/* Описание тренировок натощак */}
      <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          О тренировках натощак
        </h4>
        <div className="space-y-2 text-white/70 text-xs leading-relaxed">
          <p>
            <strong className="text-white">Преимущества:</strong> Тренировки натощак (после 12-16 часов без еды) могут ускорить сжигание жира, улучшить чувствительность к инсулину и усилить процессы автофагии. Организм учится эффективно использовать жировые запасы как источник энергии.
          </p>
          <p>
            <strong className="text-white">Важно знать:</strong> На первых неделях IF организм адаптируется. Начните с низкой интенсивности и коротких тренировок. Постепенно увеличивайте нагрузку по мере привыкания к протоколу.
          </p>
          <p>
            <strong className="text-white">Рекомендации:</strong> Пейте воду до и во время тренировки. Если чувствуете сильный голод или слабость — лучше тренироваться после первого приема пищи. Слушайте свое тело!
          </p>
        </div>
      </div>

      {/* Настройки */}
      <div className="space-y-4 mb-6">
        {/* Хронотип */}
        <div>
          <label className="text-white/80 text-xs sm:text-sm font-medium mb-2 block">Ваш хронотип:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['early', 'normal', 'late'] as Chronotype[]).map(type => (
              <button
                key={type}
                onClick={() => setChronotype(type)}
                className={`p-3 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${
                  chronotype === type
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-dark-900 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-bold mb-1">{CHRONOTYPE_INFO[type].name}</div>
                <div className="text-xs opacity-80">{CHRONOTYPE_INFO[type].description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Неделя IF */}
        <div>
          <label className="text-white/80 text-xs sm:text-sm font-medium mb-2 block">На какой неделе IF вы находитесь:</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(week => (
              <button
                key={week}
                onClick={() => setIfWeek(week as IFWeek)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  ifWeek === week
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-dark-900 shadow-lg'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {week === 5 ? '5+ недель' : week === 1 ? '1 неделя' : `${week} недели`}
              </button>
            ))}
          </div>
        </div>

        {/* Протокол IF */}
        <div>
          <label className="text-white/80 text-xs sm:text-sm font-medium mb-2 block">Ваш протокол IF:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['16/8', '18/6', '20/4', 'OMAD'] as IFProtocol[]).map(protocol => {
              const window = getIFWindow(protocol)
              return (
                <button
                  key={protocol}
                  onClick={() => setIfProtocol(protocol)}
                  className={`p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    ifProtocol === protocol
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-dark-900 shadow-lg'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold">{protocol}</div>
                  <div className="text-xs opacity-80">{window.start}-{window.end}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Кнопка генерации */}
      <button
        onClick={generateWorkoutPlan}
        className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
      >
        <Shuffle className="w-5 h-5" />
        <span>Сгенерировать план тренировок на неделю</span>
      </button>

      {/* Сгенерированный план */}
      {generatedWorkouts.length > 0 && (
        <div className="space-y-3 sm:space-y-4 mb-6">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <p className="text-white font-medium text-sm sm:text-base">
              План на неделю: <span className="text-orange-400 font-bold">{generatedWorkouts.length} тренировок</span>
            </p>
          </div>
          {generatedWorkouts.map((workout) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-xl bg-white/5 border-2 border-orange-500/30 transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
                    <h4 className="text-base sm:text-lg font-bold text-white">{workout.day}</h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">
                      {workout.time}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      workout.ifStatus === 'fasting' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {workout.ifStatus === 'fasting' ? 'Натощак ⚠️' : 'После еды'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-white/50 mb-2">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {workout.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {workout.duration} мин
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {workout.intensity === 'low' ? 'Низкая' : workout.intensity === 'medium' ? 'Средняя' : 'Высокая'} интенсивность
                    </span>
                  </div>
                </div>
              </div>

              {workout.ifStatus === 'fasting' && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-300 font-medium">⚠️ Тренировка натощак: пейте воду, при дискомфорте — остановитесь!</p>
                </div>
              )}

              {/* Упражнения */}
              <div className="mb-3">
                <div className="text-xs sm:text-sm font-medium text-white/80 mb-2">Упражнения:</div>
                <ul className="space-y-1.5">
                  {workout.exercises.map((exercise, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-white/70 flex items-start gap-2">
                      <span className="text-orange-400 font-medium flex-shrink-0">{idx + 1}.</span>
                      <span className="break-words">{exercise}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Заметки */}
              {workout.notes && (
                <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-white/70 break-words">{workout.notes}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Кнопка скачать PDF */}
      {generatedWorkouts.length > 0 && (
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              <span>Создание PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Скачать план тренировок в PDF</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}

