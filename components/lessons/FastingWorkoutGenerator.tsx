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

interface WorkSchedule {
  [key: string]: { start: string; end: string; enabled: boolean }
}

export function FastingWorkoutGenerator() {
  const [chronotype, setChronotype] = useState<Chronotype>('normal')
  const [ifWeek, setIfWeek] = useState<IFWeek>(1)
  const [ifProtocol, setIfProtocol] = useState<IFProtocol>('16/8')
  const [generatedWorkouts, setGeneratedWorkouts] = useState<Workout[]>([])
  const [downloading, setDownloading] = useState(false)
  
  // Рабочий график для каждого дня недели
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({
    'Понедельник': { start: '09:00', end: '18:00', enabled: false },
    'Вторник': { start: '09:00', end: '18:00', enabled: false },
    'Среда': { start: '09:00', end: '18:00', enabled: false },
    'Четверг': { start: '09:00', end: '18:00', enabled: false },
    'Пятница': { start: '09:00', end: '18:00', enabled: false },
    'Суббота': { start: '09:00', end: '18:00', enabled: false },
    'Воскресенье': { start: '09:00', end: '18:00', enabled: false },
  })
  
  // Свободное время для тренировок (до работы, после работы, обеденный перерыв)
  const [freeTimeSlots, setFreeTimeSlots] = useState({
    beforeWork: { enabled: true, start: '06:00', end: '08:00' },
    lunchBreak: { enabled: false, start: '12:00', end: '13:00' },
    afterWork: { enabled: true, start: '18:00', end: '22:00' },
  })
  
  // Минимальное время на отдых между тренировками (в часах)
  const [restTimeHours, setRestTimeHours] = useState(24)

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

  // Функция для проверки, свободно ли время для тренировки
  const isTimeAvailable = (day: string, timeSlot: string): boolean => {
    const daySchedule = workSchedule[day]
    
    // Если рабочий график не включен для этого дня, время доступно
    if (!daySchedule?.enabled) {
      return true
    }
    
    const [workStartHour, workStartMin] = daySchedule.start.split(':').map(Number)
    const [workEndHour, workEndMin] = daySchedule.end.split(':').map(Number)
    const [slotStartHour, slotStartMin] = timeSlot.split('-')[0].split(':').map(Number)
    const [slotEndHour, slotEndMin] = timeSlot.split('-')[1].split(':').map(Number)
    
    const workStart = workStartHour * 60 + workStartMin
    const workEnd = workEndHour * 60 + workEndMin
    const slotStart = slotStartHour * 60 + slotStartMin
    const slotEnd = slotEndHour * 60 + slotEndMin
    
    // Проверяем, не пересекается ли время тренировки с рабочим временем
    // Тренировка должна быть полностью до или после работы
    return slotEnd <= workStart || slotStart >= workEnd
  }

  // Функция для получения доступных временных слотов для тренировки
  const getAvailableTimeSlots = (day: string): string[] => {
    const daySchedule = workSchedule[day]
    const availableSlots: string[] = []
    
    // Если рабочий график не включен, используем стандартные времена из хронотипа
    if (!daySchedule?.enabled) {
      return CHRONOTYPE_INFO[chronotype].workoutTimes
    }
    
    // Проверяем свободное время до работы
    if (freeTimeSlots.beforeWork.enabled) {
      const beforeWorkStart = freeTimeSlots.beforeWork.start
      const beforeWorkEnd = freeTimeSlots.beforeWork.end
      const [startHour, startMin] = beforeWorkStart.split(':').map(Number)
      const [endHour, endMin] = beforeWorkEnd.split(':').map(Number)
      
      // Создаем слоты по 1 часу в свободное время до работы
      let currentHour = startHour
      while (currentHour < endHour) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:00`
        const slotEnd = `${(currentHour + 1).toString().padStart(2, '0')}:00`
        const slot = `${slotStart}-${slotEnd}`
        
        if (isTimeAvailable(day, slot)) {
          availableSlots.push(slot)
        }
        currentHour++
      }
    }
    
    // Проверяем обеденный перерыв
    if (freeTimeSlots.lunchBreak.enabled) {
      const lunchStart = freeTimeSlots.lunchBreak.start
      const lunchEnd = freeTimeSlots.lunchBreak.end
      const slot = `${lunchStart}-${lunchEnd}`
      
      if (isTimeAvailable(day, slot)) {
        availableSlots.push(slot)
      }
    }
    
    // Проверяем свободное время после работы
    if (freeTimeSlots.afterWork.enabled) {
      const afterWorkStart = freeTimeSlots.afterWork.start
      const afterWorkEnd = freeTimeSlots.afterWork.end
      const [startHour, startMin] = afterWorkStart.split(':').map(Number)
      const [endHour, endMin] = afterWorkEnd.split(':').map(Number)
      
      // Создаем слоты по 1 часу в свободное время после работы
      let currentHour = startHour
      while (currentHour < endHour) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:00`
        const slotEnd = `${(currentHour + 1).toString().padStart(2, '0')}:00`
        const slot = `${slotStart}-${slotEnd}`
        
        if (isTimeAvailable(day, slot)) {
          availableSlots.push(slot)
        }
        currentHour++
      }
    }
    
    // Если нет доступных слотов, используем стандартные времена из хронотипа
    if (availableSlots.length === 0) {
      return CHRONOTYPE_INFO[chronotype].workoutTimes
    }
    
    return availableSlots
  }

  const generateWorkoutPlan = () => {
    const workouts: Workout[] = []
    const ifWindow = getIFWindow(ifProtocol)
    const chronoInfo = CHRONOTYPE_INFO[chronotype]
    
    // Определяем типы тренировок на неделю
    const weekPlan = [
      { day: 'Понедельник', type: 'cardio' },
      { day: 'Вторник', type: 'strength' },
      { day: 'Среда', type: 'yoga' },
      { day: 'Четверг', type: 'mixed' },
      { day: 'Пятница', type: 'cardio' },
      { day: 'Суббота', type: ifWeek >= 3 ? 'hiit' : 'strength' },
      { day: 'Воскресенье', type: 'yoga' },
    ]

    let lastWorkoutDayIndex: number | null = null
    let lastWorkoutTimeMinutes: number | null = null

    weekPlan.forEach((dayPlan, index) => {
      const workoutType = WORKOUT_TYPES[dayPlan.type as keyof typeof WORKOUT_TYPES]
      
      // Получаем доступные временные слоты для этого дня
      const availableSlots = getAvailableTimeSlots(dayPlan.day)
      
      // Выбираем время тренировки с учетом времени на отдых
      let selectedTime = availableSlots[0] || chronoInfo.workoutTimes[0]
      
      // Проверяем, прошло ли достаточно времени с последней тренировки
      if (lastWorkoutDayIndex !== null && lastWorkoutTimeMinutes !== null) {
        const daysSinceLastWorkout = index - lastWorkoutDayIndex
        const hoursSinceLastWorkout = (daysSinceLastWorkout * 24) + 
          ((parseInt(selectedTime.split('-')[0].split(':')[0]) * 60 + 
            parseInt(selectedTime.split('-')[0].split(':')[1] || '0')) - lastWorkoutTimeMinutes) / 60
        
        // Если прошло недостаточно времени, ищем другой слот или пропускаем тренировку в этот день
        if (hoursSinceLastWorkout < restTimeHours && availableSlots.length > 1) {
          // Пробуем найти более поздний слот в этот же день
          for (const slot of availableSlots) {
            const [slotStartHour, slotStartMin] = slot.split('-')[0].split(':').map(Number)
            const slotStartMinutes = slotStartHour * 60 + slotStartMin
            const hoursFromLast = (daysSinceLastWorkout * 24) + 
              (slotStartMinutes - lastWorkoutTimeMinutes) / 60
            
            if (hoursFromLast >= restTimeHours) {
              selectedTime = slot
              break
            }
          }
        }
      }
      
      const timeHour = parseInt(selectedTime.split('-')[0].split(':')[0])
      const timeMinutes = parseInt(selectedTime.split('-')[0].split(':')[1] || '0')
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

      // Добавляем информацию о рабочем графике, если он включен
      const daySchedule = workSchedule[dayPlan.day]
      if (daySchedule?.enabled) {
        notes += ` Рабочее время: ${daySchedule.start}-${daySchedule.end}.`
      }

      workouts.push({
        id: `workout-${index}`,
        day: dayPlan.day,
        time: selectedTime,
        type: workoutType.name,
        duration,
        intensity,
        exercises: selectedExercises,
        notes,
        ifStatus: isFasting ? 'fasting' : 'fed',
      })
      
      // Обновляем время последней тренировки
      lastWorkoutDayIndex = index
      lastWorkoutTimeMinutes = timeHour * 60 + timeMinutes
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

      // Создаем красивый HTML элемент с темными стилями
      const printContent = document.createElement('div')
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '50px'
      printContent.style.background = 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0a0a0b 100%)'
      printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      printContent.style.color = '#ffffff'
      printContent.style.borderRadius = '20px'

      const statusText = (status: string) => status === 'fasting' ? 'Натощак ⚠️' : 'После еды'
      const intensityText = (intensity: string) => {
        if (intensity === 'low') return 'Низкая'
        if (intensity === 'medium') return 'Средняя'
        return 'Высокая'
      }
      const intensityColor = (intensity: string) => {
        if (intensity === 'high') return '#ff6b35'
        if (intensity === 'medium') return '#00d4ff'
        return '#10b981'
      }

      // Заголовок документа
      printContent.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
          border: 2px solid rgba(255, 107, 53, 0.3);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 107, 53, 0.1);
        ">
          <h1 style="
            font-size: 38px;
            font-weight: bold;
            text-align: center;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #ff6b35 0%, #ffa500 100%);
            color: #ff6b35;
            text-shadow: 0 0 30px rgba(255, 107, 53, 0.5), 0 2px 10px rgba(0, 0, 0, 0.5);
          ">
            План тренировок натощак
          </h1>
          <p style="text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 16px; margin: 0 0 30px 0; text-transform: uppercase; letter-spacing: 2px;">
            Хронотип: ${CHRONOTYPE_INFO[chronotype].name} | Неделя IF: ${ifWeek} | Протокол: ${ifProtocol}
          </p>
          <div style="
            background: rgba(255, 107, 53, 0.15);
            border: 2px solid rgba(255, 107, 53, 0.3);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 30px;
            color: #ff6b35;
            font-size: 14px;
          ">
            <p style="margin: 5px 0; font-weight: bold;">⚠️ ВАЖНО: Проконсультируйтесь с врачом перед началом тренировок натощак!</p>
            <p style="margin: 5px 0; color: rgba(255, 255, 255, 0.8);">Тренировки натощак подходят не всем. При хронических заболеваниях, беременности, диабете, проблемах с сердцем или давлением обязательна консультация специалиста.</p>
          </div>
        </div>
      `

      // Добавляем тренировки
      generatedWorkouts.forEach((workout, index) => {
        const workoutDiv = document.createElement('div')
        workoutDiv.style.marginBottom = '30px'
        workoutDiv.style.pageBreakInside = 'avoid'
        workoutDiv.innerHTML = `
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 25px;
            backdrop-filter: blur(10px);
          ">
            <h2 style="
              font-size: 22px;
              color: #ff6b35;
              margin: 0 0 12px 0;
              font-weight: bold;
            ">
              ${index + 1}. ${workout.day} - ${workout.time}
            </h2>
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            ">
              <div style="
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 10px;
                padding: 10px;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
              ">
                <strong style="color: #3b82f6;">Тип:</strong> ${workout.type}
              </div>
              <div style="
                background: ${workout.ifStatus === 'fasting' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
                border: 1px solid ${workout.ifStatus === 'fasting' ? 'rgba(255, 107, 53, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
                border-radius: 10px;
                padding: 10px;
                font-size: 14px;
                color: ${workout.ifStatus === 'fasting' ? '#ff6b35' : '#10b981'};
              ">
                <strong>${statusText(workout.ifStatus)}</strong>
              </div>
              <div style="
                background: rgba(${intensityColor(workout.intensity).replace('#', '').match(/.{1,2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.15);
                border: 1px solid ${intensityColor(workout.intensity)}40;
                border-radius: 10px;
                padding: 10px;
                font-size: 14px;
                color: ${intensityColor(workout.intensity)};
              ">
                <strong>Интенсивность:</strong> ${intensityText(workout.intensity)}
              </div>
              <div style="
                background: rgba(0, 212, 255, 0.15);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 10px;
                font-size: 14px;
                color: #00d4ff;
              ">
                <strong>Длительность:</strong> ${workout.duration} мин
              </div>
            </div>
            <h3 style="
              font-size: 18px;
              color: #ff6b35;
              margin: 15px 0 12px 0;
              font-weight: bold;
            ">
              💪 Упражнения:
            </h3>
            <ul style="
              margin: 0 0 15px 0;
              padding-left: 25px;
              line-height: 2;
              font-size: 15px;
              list-style: none;
            ">
              ${workout.exercises.map(exercise => `
                <li style="
                  color: rgba(255, 255, 255, 0.9);
                  margin-bottom: 6px;
                  padding-left: 20px;
                  position: relative;
                ">
                  <span style="position: absolute; left: 0; color: #ff6b35; font-weight: bold;">•</span>
                  ${exercise}
                </li>
              `).join('')}
            </ul>
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border-left: 3px solid #ff6b35;
              padding: 12px;
              margin-top: 12px;
              border-radius: 8px;
            ">
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.6; margin: 0;">
                ${workout.notes}
              </p>
            </div>
          </div>
        `
        printContent.appendChild(workoutDiv)
      })

      // Добавляем элемент в DOM
      document.body.appendChild(printContent)

      // Используем html2canvas для создания изображения
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0a0b',
        allowTaint: true
      })

      // Удаляем временный элемент
      document.body.removeChild(printContent)

      // Конвертируем canvas в изображение и добавляем в PDF
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

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

        {/* Рабочий график */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-xs sm:text-sm font-medium mb-3 block flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Рабочий график (укажите время работы для каждого дня)
          </label>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map(day => {
              const daySchedule = workSchedule[day]
              return (
                <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={daySchedule?.enabled || false}
                      onChange={(e) => {
                        setWorkSchedule(prev => ({
                          ...prev,
                          [day]: { ...prev[day], enabled: e.target.checked }
                        }))
                      }}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-white/70 text-xs sm:text-sm font-medium">{day}</span>
                  </div>
                  {daySchedule?.enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={daySchedule.start}
                        onChange={(e) => {
                          setWorkSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day], start: e.target.value }
                          }))
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                      />
                      <span className="text-white/50 text-xs">—</span>
                      <input
                        type="time"
                        value={daySchedule.end}
                        onChange={(e) => {
                          setWorkSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day], end: e.target.value }
                          }))
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Свободное время для тренировок */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-xs sm:text-sm font-medium mb-3 block flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Свободное время для тренировок
          </label>
          <div className="space-y-3">
            {/* До работы */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={freeTimeSlots.beforeWork.enabled}
                  onChange={(e) => {
                    setFreeTimeSlots(prev => ({
                      ...prev,
                      beforeWork: { ...prev.beforeWork, enabled: e.target.checked }
                    }))
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-white/70 text-xs sm:text-sm">До работы</span>
              </div>
              {freeTimeSlots.beforeWork.enabled && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={freeTimeSlots.beforeWork.start}
                    onChange={(e) => {
                      setFreeTimeSlots(prev => ({
                        ...prev,
                        beforeWork: { ...prev.beforeWork, start: e.target.value }
                      }))
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                  />
                  <span className="text-white/50 text-xs">—</span>
                  <input
                    type="time"
                    value={freeTimeSlots.beforeWork.end}
                    onChange={(e) => {
                      setFreeTimeSlots(prev => ({
                        ...prev,
                        beforeWork: { ...prev.beforeWork, end: e.target.value }
                      }))
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}
            </div>

            {/* Обеденный перерыв */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={freeTimeSlots.lunchBreak.enabled}
                  onChange={(e) => {
                    setFreeTimeSlots(prev => ({
                      ...prev,
                      lunchBreak: { ...prev.lunchBreak, enabled: e.target.checked }
                    }))
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-white/70 text-xs sm:text-sm">Обеденный перерыв</span>
              </div>
              {freeTimeSlots.lunchBreak.enabled && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={freeTimeSlots.lunchBreak.start}
                    onChange={(e) => {
                      setFreeTimeSlots(prev => ({
                        ...prev,
                        lunchBreak: { ...prev.lunchBreak, start: e.target.value }
                      }))
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                  />
                  <span className="text-white/50 text-xs">—</span>
                  <input
                    type="time"
                    value={freeTimeSlots.lunchBreak.end}
                    onChange={(e) => {
                      setFreeTimeSlots(prev => ({
                        ...prev,
                        lunchBreak: { ...prev.lunchBreak, end: e.target.value }
                      }))
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}
            </div>

            {/* После работы */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={freeTimeSlots.afterWork.enabled}
                  onChange={(e) => {
                    setFreeTimeSlots(prev => ({
                      ...prev,
                      afterWork: { ...prev.afterWork, enabled: e.target.checked }
                    }))
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-white/70 text-xs sm:text-sm">После работы</span>
              </div>
              {freeTimeSlots.afterWork.enabled && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={freeTimeSlots.afterWork.start}
                    onChange={(e) => {
                      setFreeTimeSlots(prev => ({
                        ...prev,
                        afterWork: { ...prev.afterWork, start: e.target.value }
                      }))
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                  />
                  <span className="text-white/50 text-xs">—</span>
                  <input
                    type="time"
                    value={freeTimeSlots.afterWork.end}
                    onChange={(e) => {
                      setFreeTimeSlots(prev => ({
                        ...prev,
                        afterWork: { ...prev.afterWork, end: e.target.value }
                      }))
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Время на отдых */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="text-white/80 text-xs sm:text-sm font-medium mb-2 block flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Минимальное время на отдых между тренировками
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="12"
              max="48"
              step="6"
              value={restTimeHours}
              onChange={(e) => setRestTimeHours(Number(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-white font-medium text-sm min-w-[80px] text-right">
              {restTimeHours} {restTimeHours === 24 ? 'час' : restTimeHours < 24 ? 'часов' : 'часов'}
            </span>
          </div>
          <p className="text-white/50 text-xs mt-2">
            Рекомендуется минимум 24 часа между интенсивными тренировками для восстановления
          </p>
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

