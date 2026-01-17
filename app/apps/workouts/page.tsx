'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, Dumbbell, Heart, Zap, Target, Calendar, 
  Clock, TrendingUp, Download, ArrowLeft, Sparkles,
  CheckCircle2, AlertCircle, Info
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

interface DayWorkout {
  day: number
  dayName: string
  type: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sport-specific' | 'recovery'
  duration: number
  intensity: 'low' | 'medium' | 'high'
  exercises: WorkoutExercise[]
  notes: string
  calories?: number
}

interface WorkoutPlan {
  level: 'amateur' | 'athlete'
  sport?: string
  dailyCalories: number
  weight: number
  age: number
  workoutDuration: number
  programDurationType: 'day' | 'week' | 'month'
  workoutTypes: string[]
  workouts: DayWorkout[]
  totalCalories: number
  weeklyFrequency: number
}

const SPORTS = [
  'Бег',
  'Плавание',
  'Велоспорт',
  'Футбол',
  'Баскетбол',
  'Теннис',
  'Бокс',
  'Борьба',
  'Тяжелая атлетика',
  'Кроссфит',
  'Триатлон',
  'Другое'
]

const WORKOUT_TYPES = [
  { id: 'strength', name: 'Силовые', icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'cardio', name: 'Кардио', icon: <Heart className="w-5 h-5" /> },
  { id: 'hiit', name: 'HIIT', icon: <Zap className="w-5 h-5" /> },
  { id: 'yoga', name: 'Йога/Растяжка', icon: <Activity className="w-5 h-5" /> },
  { id: 'sport-specific', name: 'Спортивная специфика', icon: <Target className="w-5 h-5" /> },
  { id: 'recovery', name: 'Восстановление', icon: <Heart className="w-5 h-5" /> }
]

const STRENGTH_EXERCISES = {
  amateur: [
    { name: 'Приседания', sets: 3, reps: '12-15', rest: '60 сек', notes: 'Фокус на технике' },
    { name: 'Отжимания', sets: 3, reps: '10-12', rest: '60 сек' },
    { name: 'Планка', sets: 3, reps: '30-45 сек', rest: '60 сек' },
    { name: 'Выпады', sets: 3, reps: '10 на каждую ногу', rest: '60 сек' },
    { name: 'Подтягивания/Тяга', sets: 3, reps: '8-10', rest: '60 сек' },
    { name: 'Жим гантелей', sets: 3, reps: '10-12', rest: '60 сек' },
    { name: 'Румынская тяга', sets: 3, reps: '10-12', rest: '60 сек' },
    { name: 'Скручивания', sets: 3, reps: '15-20', rest: '45 сек' }
  ],
  athlete: [
    { name: 'Приседания со штангой', sets: 4, reps: '6-8', rest: '120 сек', notes: 'Тяжелый вес, фокус на силе' },
    { name: 'Становая тяга', sets: 4, reps: '5-6', rest: '180 сек', notes: 'Максимальная нагрузка' },
    { name: 'Жим лежа', sets: 4, reps: '6-8', rest: '120 сек' },
    { name: 'Подтягивания с весом', sets: 4, reps: '6-8', rest: '90 сек' },
    { name: 'Жим стоя', sets: 4, reps: '6-8', rest: '90 сек' },
    { name: 'Тяга штанги в наклоне', sets: 4, reps: '8-10', rest: '90 сек' },
    { name: 'Приседания на одной ноге', sets: 3, reps: '6-8 на каждую', rest: '90 сек' },
    { name: 'Фермерская прогулка', sets: 3, reps: '30-50 метров', rest: '120 сек' }
  ]
}

const CARDIO_EXERCISES = {
  amateur: [
    { name: 'Бег трусцой', sets: 1, reps: '20-30 мин', rest: '-', notes: 'Умеренный темп' },
    { name: 'Велосипед', sets: 1, reps: '30-40 мин', rest: '-', notes: 'Стабильный темп' },
    { name: 'Ходьба в гору', sets: 1, reps: '30-45 мин', rest: '-', notes: 'Умеренный наклон' },
    { name: 'Плавание', sets: 1, reps: '20-30 мин', rest: '-', notes: 'Свободный стиль' },
    { name: 'Эллипс', sets: 1, reps: '25-35 мин', rest: '-', notes: 'Среднее сопротивление' }
  ],
  athlete: [
    { name: 'Интервальный бег', sets: 1, reps: '8x400м (1:1 отдых)', rest: 'Равный времени бега', notes: 'Высокая интенсивность' },
    { name: 'Темповый бег', sets: 1, reps: '20-30 мин', rest: '-', notes: '85-90% от максимума' },
    { name: 'Велосипед (интервалы)', sets: 1, reps: '5x5 мин (2 мин отдых)', rest: '2 мин', notes: 'Высокая мощность' },
    { name: 'Плавание (интервалы)', sets: 1, reps: '10x100м (30 сек отдых)', rest: '30 сек', notes: 'Техника + скорость' },
    { name: 'Гребля', sets: 1, reps: '4x5 мин (2 мин отдых)', rest: '2 мин', notes: 'Максимальная мощность' }
  ]
}

const HIIT_EXERCISES = {
  amateur: [
    { name: 'Бёрпи', sets: 4, reps: '30 сек работа / 30 сек отдых', rest: '30 сек', notes: 'Умеренный темп' },
    { name: 'Прыжки на месте', sets: 4, reps: '30 сек работа / 30 сек отдых', rest: '30 сек' },
    { name: 'Горные альпинисты', sets: 4, reps: '30 сек работа / 30 сек отдых', rest: '30 сек' },
    { name: 'Прыжки в планке', sets: 4, reps: '20 сек работа / 40 сек отдых', rest: '40 сек' },
    { name: 'Спринт на месте', sets: 4, reps: '20 сек работа / 40 сек отдых', rest: '40 сек' }
  ],
  athlete: [
    { name: 'Бёрпи с прыжком', sets: 6, reps: '20 сек работа / 10 сек отдых', rest: '10 сек', notes: 'Максимальная интенсивность' },
    { name: 'Табата (любое упражнение)', sets: 8, reps: '20 сек работа / 10 сек отдых', rest: '10 сек', notes: '8 раундов, 4 минуты' },
    { name: 'Спринт', sets: 8, reps: '20 сек работа / 10 сек отдых', rest: '10 сек', notes: 'Максимальная скорость' },
    { name: 'Прыжки на ящик', sets: 6, reps: '20 сек работа / 10 сек отдых', rest: '10 сек', notes: 'Высота 50-70 см' },
    { name: 'Толкание саней', sets: 4, reps: '30 сек работа / 30 сек отдых', rest: '30 сек', notes: 'Максимальная мощность' }
  ]
}

const SPORT_SPECIFIC_EXERCISES: Record<string, WorkoutExercise[]> = {
  'Бег': [
    { name: 'Беговая работа', sets: 1, reps: '30-45 мин', rest: '-', notes: 'Темповый бег' },
    { name: 'Интервалы 400м', sets: 8, reps: '400м (1:1 отдых)', rest: 'Равный времени бега', notes: 'Высокая интенсивность' },
    { name: 'Фартлек', sets: 1, reps: '20-30 мин', rest: '-', notes: 'Переменный темп' },
    { name: 'Бег в гору', sets: 6, reps: '200м подъем', rest: 'Спуск шагом', notes: 'Силовая выносливость' }
  ],
  'Плавание': [
    { name: 'Разминка', sets: 1, reps: '400м', rest: '-', notes: 'Свободный стиль' },
    { name: 'Основная часть', sets: 1, reps: '10x100м (30 сек отдых)', rest: '30 сек', notes: 'Техника + скорость' },
    { name: 'Спринты', sets: 8, reps: '25м (20 сек отдых)', rest: '20 сек', notes: 'Максимальная скорость' },
    { name: 'Заминка', sets: 1, reps: '200м', rest: '-', notes: 'Легкий темп' }
  ],
  'Велоспорт': [
    { name: 'Разминка', sets: 1, reps: '10 мин', rest: '-', notes: 'Легкий темп' },
    { name: 'Интервалы', sets: 5, reps: '5 мин (2 мин отдых)', rest: '2 мин', notes: 'Высокая мощность' },
    { name: 'Подъемы в гору', sets: 4, reps: '3 мин подъем', rest: 'Спуск', notes: 'Силовая выносливость' },
    { name: 'Заминка', sets: 1, reps: '10 мин', rest: '-', notes: 'Легкий темп' }
  ],
  'Футбол': [
    { name: 'Разминка с мячом', sets: 1, reps: '10 мин', rest: '-', notes: 'Дриблинг, передачи' },
    { name: 'Спринты', sets: 8, reps: '20м (30 сек отдых)', rest: '30 сек', notes: 'Максимальная скорость' },
    { name: 'Игровые упражнения', sets: 1, reps: '20-30 мин', rest: '-', notes: 'Игра 1x1, 2x2' },
    { name: 'Удары по воротам', sets: 3, reps: '10 ударов', rest: '2 мин', notes: 'Техника + сила' }
  ],
  'Бокс': [
    { name: 'Разминка', sets: 1, reps: '10 мин', rest: '-', notes: 'Скакалка, растяжка' },
    { name: 'Работа на груше', sets: 6, reps: '3 мин работа / 1 мин отдых', rest: '1 мин', notes: 'Комбинации ударов' },
    { name: 'Спарринг', sets: 3, reps: '3 мин раунд', rest: '1 мин', notes: 'Техника + выносливость' },
    { name: 'Работа на мешке', sets: 4, reps: '2 мин работа / 1 мин отдых', rest: '1 мин', notes: 'Сила ударов' }
  ]
}

export default function WorkoutGeneratorPage() {
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [level, setLevel] = useState<'amateur' | 'athlete'>('amateur')
  const [sport, setSport] = useState('')
  const [dailyCalories, setDailyCalories] = useState('2000')
  const [weight, setWeight] = useState('70')
  const [age, setAge] = useState('30')
  const [workoutDuration, setWorkoutDuration] = useState('60')
  const [programDurationType, setProgramDurationType] = useState<'day' | 'week' | 'month'>('week')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['strength', 'cardio'])
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [generating, setGenerating] = useState(false)

  const toggleWorkoutType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const calculateCaloriesPerWorkout = (level: 'amateur' | 'athlete', duration: number, type: string, age: number): number => {
    const baseCalories = level === 'amateur' ? 5 : 8 // калорий в минуту
    const multipliers: Record<string, number> = {
      'strength': 0.8,
      'cardio': 1.2,
      'hiit': 1.5,
      'yoga': 0.5,
      'sport-specific': 1.3,
      'recovery': 0.4
    }
    // Учитываем возраст: с возрастом метаболизм замедляется
    const ageMultiplier = age < 25 ? 1.1 : age < 35 ? 1.0 : age < 45 ? 0.95 : age < 55 ? 0.9 : 0.85
    return Math.round(baseCalories * duration * (multipliers[type] || 1) * parseInt(weight) / 70 * ageMultiplier)
  }

  const generateWorkoutPlan = () => {
    setGenerating(true)
    
    setTimeout(() => {
      const workouts: DayWorkout[] = []
      const userAge = parseInt(age)
      
      // Определяем количество дней в зависимости от типа программы
      let days = 0
      if (programDurationType === 'day') {
        days = 1
      } else if (programDurationType === 'week') {
        days = 7
      } else if (programDurationType === 'month') {
        days = 30
      }
      
      const workoutTypes = selectedTypes
      const weeklyFrequency = workoutTypes.length * 2 // 2 тренировки каждого типа в неделю
      
      const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
      
      let totalCalories = 0
      let workoutIndex = 0
      
      // Учитываем возраст при генерации тренировок
      const ageAdjustment = userAge < 25 ? 1.0 : userAge < 35 ? 0.95 : userAge < 45 ? 0.9 : userAge < 55 ? 0.85 : 0.8
      
      for (let day = 1; day <= days; day++) {
        const dayOfWeek = (day - 1) % 7
        const dayName = dayNames[dayOfWeek]
        
        // Определяем тип тренировки для дня
        const typeIndex = workoutIndex % workoutTypes.length
        const workoutType = workoutTypes[typeIndex] as 'strength' | 'cardio' | 'hiit' | 'yoga' | 'sport-specific' | 'recovery'
        
        let exercises: WorkoutExercise[] = []
        let intensity: 'low' | 'medium' | 'high' = 'medium'
        let notes = ''
        
        // Генерируем упражнения в зависимости от типа и возраста
        if (workoutType === 'strength') {
          const exercisePool = STRENGTH_EXERCISES[level]
          // С возрастом уменьшаем количество упражнений и интенсивность
          const exerciseCount = userAge < 35 
            ? (level === 'amateur' ? 5 : 6)
            : userAge < 50
            ? (level === 'amateur' ? 4 : 5)
            : (level === 'amateur' ? 3 : 4)
          exercises = exercisePool.slice(0, exerciseCount).map(ex => ({ ...ex }))
          intensity = userAge < 35 
            ? (level === 'amateur' ? 'medium' : 'high')
            : userAge < 50
            ? (level === 'amateur' ? 'medium' : 'medium')
            : 'low'
          notes = userAge < 35
            ? (level === 'amateur' 
              ? '💪 Фокус на технике выполнения. Отдых между подходами обязателен.'
              : '💪 Тяжелые веса, фокус на силе. Обязательная разминка перед тренировкой.')
            : userAge < 50
            ? '💪 Умеренная нагрузка с акцентом на технику. Обязательная разминка и заминка.'
            : '💪 Легкая-умеренная нагрузка. Приоритет безопасности и техники. Обязательная разминка 10-15 минут.'
        } else if (workoutType === 'cardio') {
          const exercisePool = CARDIO_EXERCISES[level]
          exercises = [exercisePool[Math.floor(Math.random() * exercisePool.length)]]
          intensity = level === 'amateur' ? 'low' : 'medium'
          notes = level === 'amateur'
            ? '❤️ Умеренный темп, поддерживайте пульс в зоне 60-70% от максимума.'
            : '❤️ Интервальная работа, пульс 75-85% от максимума. Контролируйте восстановление.'
        } else if (workoutType === 'hiit') {
          const exercisePool = HIIT_EXERCISES[level]
          exercises = exercisePool.slice(0, level === 'amateur' ? 4 : 5).map(ex => ({ ...ex }))
          intensity = 'high'
          notes = '⚡ Высокая интенсивность! Обязательная разминка 5-10 мин. При плохом самочувствии снизьте интенсивность.'
        } else if (workoutType === 'sport-specific' && sport && SPORT_SPECIFIC_EXERCISES[sport]) {
          exercises = SPORT_SPECIFIC_EXERCISES[sport].map(ex => ({ ...ex }))
          intensity = level === 'amateur' ? 'medium' : 'high'
          notes = `🎯 Специфическая тренировка для ${sport}. Фокус на технике и специфических навыках.`
        } else if (workoutType === 'yoga') {
          exercises = [
            { name: 'Хатха йога', sets: 1, reps: '30-40 мин', rest: '-', notes: 'Статические позы' },
            { name: 'Виньяса флоу', sets: 1, reps: '25-35 мин', rest: '-', notes: 'Динамическая последовательность' },
            { name: 'Растяжка', sets: 1, reps: '15-20 мин', rest: '-', notes: 'Глубокое растягивание' }
          ].slice(0, 1)
          intensity = 'low'
          notes = '🧘 Восстановительная тренировка. Фокус на гибкости и расслаблении.'
        } else if (workoutType === 'recovery') {
          exercises = [
            { name: 'Легкая прогулка', sets: 1, reps: '20-30 мин', rest: '-', notes: 'Медленный темп' },
            { name: 'Растяжка', sets: 1, reps: '15-20 мин', rest: '-', notes: 'Статическая растяжка' },
            { name: 'Йога', sets: 1, reps: '20-30 мин', rest: '-', notes: 'Восстановительная практика' }
          ]
          intensity = 'low'
          notes = '🔄 День восстановления. Легкая активность для восстановления мышц.'
        }
        
        // Добавляем кето/IF заметки
        if (workoutType !== 'recovery' && workoutType !== 'yoga') {
          notes += '\n\n🥑 Кето/IF советы: При низкоуглеводном питании увеличьте потребление электролитов. Если тренируетесь натощак - пейте воду с солью.'
        }
        
        const duration = parseInt(workoutDuration)
        const calories = calculateCaloriesPerWorkout(level, duration, workoutType, userAge)
        totalCalories += calories
        
        workouts.push({
          day,
          dayName,
          type: workoutType,
          duration,
          intensity,
          exercises,
          notes,
          calories
        })
        
        workoutIndex++
      }
      
      setWorkoutPlan({
        level,
        sport: level === 'athlete' ? sport : undefined,
        dailyCalories: parseInt(dailyCalories),
        weight: parseInt(weight),
        age: userAge,
        workoutDuration: parseInt(workoutDuration),
        programDurationType,
        workoutTypes: selectedTypes,
        workouts,
        totalCalories,
        weeklyFrequency
      })
      
      setStep('result')
      setGenerating(false)
    }, 1500)
  }

  const downloadPDF = async () => {
    if (!workoutPlan) return
    
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Заголовок
      pdf.setFontSize(20)
      pdf.setTextColor(0, 0, 0)
      pdf.text('ПЛАН ТРЕНИРОВОК', 105, 20, { align: 'center' })

      // Основная информация
      pdf.setFontSize(12)
      let y = 30
      
      pdf.text(`Уровень: ${level === 'amateur' ? 'Любитель' : 'Спортсмен'}`, 20, y)
      y += 7
      
      if (sport) {
        pdf.text(`Вид спорта: ${sport}`, 20, y)
        y += 7
      }
      
      pdf.text(`Вес: ${weight} кг`, 20, y)
      y += 7
      pdf.text(`Калории в день: ${dailyCalories} ккал`, 20, y)
      y += 7
      pdf.text(`Возраст: ${workoutPlan.age} лет`, 20, y)
      y += 7
      const durationText = workoutPlan.programDurationType === 'day' 
        ? '1 день' 
        : workoutPlan.programDurationType === 'week'
        ? '1 неделя'
        : '1 месяц'
      pdf.text(`Длительность программы: ${durationText}`, 20, y)
      y += 7
      pdf.text(`Длительность тренировки: ${workoutDuration} минут`, 20, y)
      y += 10

      // Тренировки
      const pageHeight = 297 // A4 height in mm
      const margin = 20
      const maxWidth = 170
      let pageNum = 1

      workoutPlan.workouts.forEach((w, index) => {
        // Проверяем, нужно ли создать новую страницу
        if (y > pageHeight - 60) {
          pdf.addPage()
          pageNum++
          y = 20
        }

        // Заголовок дня
        pdf.setFontSize(14)
        pdf.setTextColor(0, 0, 0)
        pdf.text(`День ${w.day} • ${w.dayName}`, 20, y)
        y += 8

        // Информация о тренировке
        pdf.setFontSize(11)
        const workoutInfo = [
          `Тип: ${w.type}`,
          `Длительность: ${w.duration} мин`,
          `Интенсивность: ${w.intensity}`,
          `Калории: ${w.calories} ккал`
        ]

        workoutInfo.forEach(info => {
          if (y > pageHeight - 50) {
            pdf.addPage()
            pageNum++
            y = 20
          }
          pdf.text(info, 25, y)
          y += 6
        })

        y += 2

        // Упражнения
        if (y > pageHeight - 40) {
          pdf.addPage()
          pageNum++
          y = 20
        }

        pdf.setFontSize(11)
        pdf.text('Упражнения:', 25, y)
        y += 7

        pdf.setFontSize(10)
        w.exercises.forEach(ex => {
          if (y > pageHeight - 30) {
            pdf.addPage()
            pageNum++
            y = 20
          }
          const exerciseText = `• ${ex.name}: ${ex.sets} x ${ex.reps} (отдых: ${ex.rest})`
          const lines = pdf.splitTextToSize(exerciseText, maxWidth)
          pdf.text(lines, 30, y)
          y += lines.length * 5 + 2
        })

        y += 2

        // Заметки
        if (w.notes) {
          if (y > pageHeight - 30) {
            pdf.addPage()
            pageNum++
            y = 20
          }
          pdf.setFontSize(10)
          pdf.text('Заметки:', 25, y)
          y += 6
          const notesLines = pdf.splitTextToSize(w.notes, maxWidth)
          pdf.text(notesLines, 30, y)
          y += notesLines.length * 5 + 5
        }

        // Разделитель между днями (если не последний)
        if (index < workoutPlan.workouts.length - 1) {
          if (y > pageHeight - 20) {
            pdf.addPage()
            pageNum++
            y = 20
          } else {
            y += 5
            pdf.setLineWidth(0.5)
            pdf.line(20, y, 190, y)
            y += 8
          }
        }
      })

      // Сохраняем PDF
      const fileName = `План-тренировок-${new Date().toISOString().split('T')[0]}.pdf`
      
      // Используем blob URL для лучшей совместимости с мобильными устройствами
      const pdfBlob = pdf.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      link.style.display = 'none'
      
      // Добавляем ссылку в DOM и кликаем
      document.body.appendChild(link)
      link.click()
      
      // Удаляем ссылку и очищаем blob URL через небольшую задержку
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 100)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Ошибка при генерации PDF. Попробуйте еще раз.')
    }
  }

  if (step === 'result' && workoutPlan) {
    return (
      <main className="min-h-screen px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/apps" className="inline-flex items-center gap-2 text-white/60 hover:text-accent-electric transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Назад к приложениям
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-display font-bold text-white mb-2">
                  Ваш план тренировок
                </h1>
                <p className="text-white/60">
                  Программа на {workoutPlan.programDurationType === 'day' ? '1 день' : workoutPlan.programDurationType === 'week' ? '1 неделю' : '1 месяц'} • {workoutPlan.workouts.length} {workoutPlan.workouts.length === 1 ? 'тренировка' : workoutPlan.workouts.length < 5 ? 'тренировки' : 'тренировок'}
                </p>
              </div>
              <Button onClick={downloadPDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Скачать PDF
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="card p-4">
              <div className="text-white/60 text-sm mb-1">Уровень</div>
              <div className="text-2xl font-bold text-white">
                {level === 'amateur' ? 'Любитель' : 'Спортсмен'}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-white/60 text-sm mb-1">Тренировок в неделю</div>
              <div className="text-2xl font-bold text-white">{workoutPlan.weeklyFrequency}</div>
            </div>
            <div className="card p-4">
              <div className="text-white/60 text-sm mb-1">Всего калорий</div>
              <div className="text-2xl font-bold text-accent-electric">{workoutPlan.totalCalories.toLocaleString()}</div>
            </div>
            <div className="card p-4">
              <div className="text-white/60 text-sm mb-1">Среднее за тренировку</div>
              <div className="text-2xl font-bold text-accent-neon">
                {Math.round(workoutPlan.totalCalories / workoutPlan.workouts.length)}
              </div>
            </div>
          </motion.div>

          {/* Workouts */}
          <div className="space-y-6">
            {workoutPlan.workouts.map((workout, index) => (
              <motion.div
                key={workout.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      День {workout.day} • {workout.dayName}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {WORKOUT_TYPES.find(t => t.id === workout.type)?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workout.duration} мин
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workout.intensity === 'high' ? 'bg-red-500/20 text-red-400' :
                        workout.intensity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {workout.intensity === 'high' ? 'Высокая' : workout.intensity === 'medium' ? 'Средняя' : 'Низкая'}
                      </span>
                      {workout.calories && (
                        <span className="text-accent-electric font-medium">
                          🔥 {workout.calories} ккал
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {workout.exercises.map((exercise, exIndex) => (
                    <div key={exIndex} className="bg-dark-800/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-white">{exercise.name}</h4>
                        <span className="text-sm text-white/60">
                          {exercise.sets} x {exercise.reps}
                        </span>
                      </div>
                      {exercise.rest !== '-' && (
                        <p className="text-sm text-white/60">Отдых: {exercise.rest}</p>
                      )}
                      {exercise.notes && (
                        <p className="text-sm text-accent-electric/80 mt-1">{exercise.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {workout.notes && (
                  <div className="bg-accent-electric/10 border border-accent-electric/30 rounded-lg p-4">
                    <p className="text-sm text-white whitespace-pre-line">{workout.notes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button onClick={() => setStep('form')} variant="secondary">
              Создать новый план
            </Button>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link href="/apps" className="inline-flex items-center gap-2 text-white/60 hover:text-accent-electric transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Назад к приложениям
          </Link>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-electric to-accent-neon flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-dark-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Генератор тренировок
          </h1>
          <p className="text-lg text-white/60">
            Создайте персональную программу тренировок под ваши цели
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8 space-y-8"
        >
          {/* Level Selection */}
          <div>
            <label className="block text-white font-semibold mb-4">
              Уровень подготовки
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setLevel('amateur')
                  setSport('')
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  level === 'amateur'
                    ? 'border-accent-electric bg-accent-electric/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-3xl mb-2">🏃</div>
                <div className="text-white font-semibold mb-1">Любитель</div>
                <div className="text-sm text-white/60">Начинающий или средний уровень</div>
              </button>
              <button
                onClick={() => setLevel('athlete')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  level === 'athlete'
                    ? 'border-accent-electric bg-accent-electric/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-3xl mb-2">💪</div>
                <div className="text-white font-semibold mb-1">Спортсмен</div>
                <div className="text-sm text-white/60">Продвинутый уровень</div>
              </button>
            </div>
          </div>

          {/* Sport Selection (only for athletes) */}
          {level === 'athlete' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <label className="block text-white font-semibold mb-4">
                Вид спорта
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-accent-electric focus:outline-none"
              >
                <option value="">Выберите вид спорта</option>
                {SPORTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Вес (кг)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-accent-electric focus:outline-none"
                min="30"
                max="200"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Калории в день (ккал)
              </label>
              <input
                type="number"
                value={dailyCalories}
                onChange={(e) => setDailyCalories(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-accent-electric focus:outline-none"
                min="1000"
                max="5000"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Длительность тренировки (мин)
              </label>
              <input
                type="number"
                value={workoutDuration}
                onChange={(e) => setWorkoutDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-accent-electric focus:outline-none"
                min="20"
                max="180"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Возраст (лет)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-accent-electric focus:outline-none"
                min="12"
                max="100"
              />
            </div>
          </div>

          {/* Program Duration Type */}
          <div>
            <label className="block text-white font-semibold mb-4">
              Длительность программы
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setProgramDurationType('day')}
                className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                  programDurationType === 'day'
                    ? 'bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 shadow-lg'
                    : 'bg-dark-800 border border-white/10 text-white hover:border-accent-electric/50'
                }`}
              >
                День
              </button>
              <button
                type="button"
                onClick={() => setProgramDurationType('week')}
                className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                  programDurationType === 'week'
                    ? 'bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 shadow-lg'
                    : 'bg-dark-800 border border-white/10 text-white hover:border-accent-electric/50'
                }`}
              >
                Неделя
              </button>
              <button
                type="button"
                onClick={() => setProgramDurationType('month')}
                className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                  programDurationType === 'month'
                    ? 'bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 shadow-lg'
                    : 'bg-dark-800 border border-white/10 text-white hover:border-accent-electric/50'
                }`}
              >
                Месяц
              </button>
            </div>
          </div>

          {/* Workout Types */}
          <div>
            <label className="block text-white font-semibold mb-4">
              Типы тренировок
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WORKOUT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => toggleWorkoutType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selectedTypes.includes(type.id)
                      ? 'border-accent-electric bg-accent-electric/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`${selectedTypes.includes(type.id) ? 'text-accent-electric' : 'text-white/60'}`}>
                    {type.icon}
                  </div>
                  <span className={`font-medium ${
                    selectedTypes.includes(type.id) ? 'text-white' : 'text-white/60'
                  }`}>
                    {type.name}
                  </span>
                  {selectedTypes.includes(type.id) && (
                    <CheckCircle2 className="w-5 h-5 text-accent-electric ml-auto" />
                  )}
                </button>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Выберите хотя бы один тип тренировки
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-accent-electric/10 border border-accent-electric/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-electric flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/80">
                <p className="font-semibold mb-1">💡 Советы для кето/IF спортсменов:</p>
                <ul className="list-disc list-inside space-y-1 text-white/60">
                  <li>При низкоуглеводном питании увеличьте потребление электролитов</li>
                  <li>Тренировки натощак эффективны, но следите за самочувствием</li>
                  <li>Восстановление особенно важно на кето - не пропускайте дни отдыха</li>
                  <li>При необходимости добавьте углеводы перед интенсивными тренировками</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateWorkoutPlan}
            disabled={selectedTypes.length === 0 || generating || (level === 'athlete' && !sport)}
            className="w-full"
            size="lg"
            isLoading={generating}
          >
            {generating ? 'Генерация плана...' : 'Сгенерировать план тренировок'}
          </Button>
        </motion.div>
      </div>
    </main>
  )
}

