'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Timer, Sparkles, TrendingUp, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface AutophagyPhase {
  hours: number
  phase: string
  description: string
  intensity: 'low' | 'medium' | 'high' | 'maximum'
  benefits: string[]
}

const AUTOPHAGY_PHASES: AutophagyPhase[] = [
  {
    hours: 0,
    phase: 'Пищеварение',
    description: 'Организм переваривает пищу',
    intensity: 'low',
    benefits: []
  },
  {
    hours: 12,
    phase: 'Начало голодания',
    description: 'Инсулин снижается, начинается расщепление гликогена',
    intensity: 'low',
    benefits: ['Снижение инсулина', 'Начало жиросжигания']
  },
  {
    hours: 14,
    phase: 'Ранняя автофагия',
    description: 'Первые признаки клеточного обновления',
    intensity: 'low',
    benefits: ['Легкое очищение клеток', 'Улучшение метаболизма']
  },
  {
    hours: 16,
    phase: 'Активная автофагия',
    description: 'Автофагия набирает обороты',
    intensity: 'medium',
    benefits: ['Очищение поврежденных белков', 'Улучшение работы митохондрий', 'Снижение воспаления']
  },
  {
    hours: 18,
    phase: 'Глубокая автофагия',
    description: 'Интенсивное клеточное обновление',
    intensity: 'high',
    benefits: ['Удаление токсинов', 'Обновление клеток', 'Улучшение иммунитета', 'Анти-эйдж эффект']
  },
  {
    hours: 20,
    phase: 'Максимальная автофагия',
    description: 'Пик клеточного обновления',
    intensity: 'maximum',
    benefits: ['Максимальное очищение', 'Обновление ДНК', 'Защита от рака', 'Замедление старения']
  },
  {
    hours: 24,
    phase: 'Продолженная автофагия',
    description: 'Автофагия продолжается на высоком уровне',
    intensity: 'high',
    benefits: ['Глубокое очищение', 'Восстановление тканей', 'Улучшение когнитивных функций']
  }
]

const IF_PROTOCOLS = {
  '12:12': { 
    fast: 12, 
    eat: 12, 
    description: 'Мягкий старт для начинающих',
    recommended: 'Для тех, кто только начинает IF'
  },
  '14:10': { 
    fast: 14, 
    eat: 10, 
    description: 'Комфортный переход к IF',
    recommended: 'Идеально для адаптации'
  },
  '16:8': { 
    fast: 16, 
    eat: 8, 
    description: 'Самый популярный и эффективный',
    recommended: 'Золотой стандарт IF'
  },
  '18:6': { 
    fast: 18, 
    eat: 6, 
    description: 'Для продвинутых пользователей',
    recommended: 'Максимальная автофагия'
  },
  '20:4': { 
    fast: 20, 
    eat: 4, 
    description: 'Продвинутый протокол',
    recommended: 'Только для опытных'
  },
}

export function IFProtocolPlanner() {
  const [selectedProtocol, setSelectedProtocol] = useState<keyof typeof IF_PROTOCOLS>('16:8')
  const [windowStart, setWindowStart] = useState('12:00')
  const [windowEnd, setWindowEnd] = useState('20:00')
  const [downloading, setDownloading] = useState(false)

  // Автоматически рассчитываем время окна при выборе протокола
  useEffect(() => {
    const protocol = IF_PROTOCOLS[selectedProtocol]
    const [startHour, startMin] = windowStart.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(startHour, startMin, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + protocol.eat)
    
    setWindowEnd(endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }))
  }, [selectedProtocol, windowStart])

  const getCurrentAutophagyPhase = (hours: number): AutophagyPhase => {
    for (let i = AUTOPHAGY_PHASES.length - 1; i >= 0; i--) {
      if (hours >= AUTOPHAGY_PHASES[i].hours) {
        return AUTOPHAGY_PHASES[i]
      }
    }
    return AUTOPHAGY_PHASES[0]
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'medium': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'high': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'maximum': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-white/60 bg-white/5 border-white/10'
    }
  }

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'Низкая'
      case 'medium': return 'Средняя'
      case 'high': return 'Высокая'
      case 'maximum': return 'Максимальная'
      default: return '—'
    }
  }

  const calculateAutophagyTimeline = () => {
    const protocol = IF_PROTOCOLS[selectedProtocol]
    const [startHour, startMin] = windowEnd.split(':').map(Number)
    const fastStart = new Date()
    fastStart.setHours(startHour, startMin, 0, 0)
    
    const timeline: Array<{ time: string; hours: number; phase: AutophagyPhase }> = []
    
    for (let hour = 0; hour <= protocol.fast; hour++) {
      const currentTime = new Date(fastStart)
      currentTime.setHours(currentTime.getHours() + hour)
      const phase = getCurrentAutophagyPhase(hour)
      timeline.push({
        time: currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }),
        hours: hour,
        phase
      })
    }
    
    return timeline
  }

  const downloadPDF = async () => {
    try {
      setDownloading(true)

      const protocol = IF_PROTOCOLS[selectedProtocol]
      const timeline = calculateAutophagyTimeline()
      const maxPhase = timeline.reduce((max, item) => 
        item.hours > max.hours ? item : max
      )

      // Создаем временный HTML элемент для PDF
      const printContent = document.createElement('div')
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '40px'
      printContent.style.backgroundColor = '#ffffff'
      printContent.style.fontFamily = 'Arial, sans-serif'
      printContent.style.color = '#000000'

      const timelineItems = timeline
        .filter((item, index) => index % 2 === 0 || item.phase.intensity === 'high' || item.phase.intensity === 'maximum')
        .map(item => {
          const benefits = item.phase.benefits.length > 0 
            ? `<ul style="margin-left: 20px; margin-top: 5px; font-size: 12px; color: #666666;">${item.phase.benefits.map(b => `<li>${b}</li>`).join('')}</ul>`
            : ''
          return `
            <div style="margin-bottom: 15px;">
              <p style="font-size: 14px; color: #000000; font-weight: bold; margin-bottom: 3px;">
                ${item.time} (${item.hours}ч) - ${item.phase.phase}
              </p>
              <p style="font-size: 13px; color: #666666; margin-bottom: 5px;">
                ${item.phase.description}
              </p>
              ${benefits}
            </div>
          `
        }).join('')

      const maxPhaseBenefits = maxPhase.phase.benefits.map(b => `<li style="margin-bottom: 5px;">${b}</li>`).join('')

      printContent.innerHTML = `
        <h1 style="font-size: 32px; color: #a855f7; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #a855f7; padding-bottom: 10px;">
          План протокола IF
        </h1>
        <p style="text-align: center; color: #666666; font-size: 14px; margin-bottom: 30px;">
          Протокол: ${selectedProtocol}
        </p>
        
        <div style="margin-bottom: 25px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">
            Окно питания: ${windowStart} - ${windowEnd}
          </p>
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">
            Голодание: ${protocol.fast} часов | Питание: ${protocol.eat} часов
          </p>
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">
            Описание: ${protocol.description}
          </p>
        </div>
        
        <h2 style="font-size: 18px; color: #a855f7; margin-bottom: 12px; margin-top: 25px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
          Фазы автофагии:
        </h2>
        <div style="margin-bottom: 25px;">
          ${timelineItems}
        </div>
        
        <h2 style="font-size: 18px; color: #dc2626; margin-bottom: 12px; margin-top: 25px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
          Максимальная автофагия: ${maxPhase.time} (${maxPhase.hours}ч)
        </h2>
        <ul style="margin-left: 25px; line-height: 2; font-size: 13px;">
          ${maxPhaseBenefits}
        </ul>
      `

      // Добавляем элемент в DOM
      document.body.appendChild(printContent)

      // Используем html2canvas для создания изображения
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Удаляем временный элемент
      document.body.removeChild(printContent)

      // Конвертируем canvas в изображение и добавляем в PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      const fileName = `IF-Протокол-${selectedProtocol}-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    }
  }

  const timeline = calculateAutophagyTimeline()
  const maxPhase = timeline.reduce((max, item) => 
    item.hours > max.hours ? item : max
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-dark-800/50 to-pink-500/10 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Timer className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Планировщик протокола IF</h3>
          <p className="text-white/60 text-xs sm:text-sm">Выберите протокол и отслеживайте фазы автофагии</p>
        </div>
      </div>

      {/* Выбор протокола */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Протокол IF:</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(IF_PROTOCOLS).map(([key, protocol]) => (
            <button
              key={key}
              onClick={() => setSelectedProtocol(key as keyof typeof IF_PROTOCOLS)}
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                selectedProtocol === key
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-dark-900 shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="font-bold">{key}</div>
              <div className="text-[10px] sm:text-xs opacity-80 mt-0.5">{protocol.fast}ч голода</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs sm:text-sm text-white/60">{IF_PROTOCOLS[selectedProtocol].description}</p>
      </div>

      {/* Время окна питания */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
        <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Окно питания:</label>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-white/60 text-xs mb-1.5">Начало:</label>
            <input
              type="time"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-white/60 text-xs mb-1.5">Конец:</label>
            <input
              type="time"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-white/50">
          Голодание: {IF_PROTOCOLS[selectedProtocol].fast}ч | Питание: {IF_PROTOCOLS[selectedProtocol].eat}ч
        </div>
      </div>

      {/* Таймлайн автофагии */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            Фазы автофагии
          </h4>
          <span className="text-xs sm:text-sm text-white/60">
            Максимум: {maxPhase.time} ({maxPhase.hours}ч)
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {timeline.map((item, index) => {
            const isMaxPhase = item.hours === maxPhase.hours
            const intensityClass = getIntensityColor(item.phase.intensity)
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  isMaxPhase 
                    ? 'ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20' 
                    : ''
                } ${intensityClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm sm:text-base text-white">
                        {item.time} ({item.hours}ч)
                      </div>
                      <div className="text-xs sm:text-sm text-white/80 font-medium">
                        {item.phase.phase}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium ${
                      item.phase.intensity === 'maximum' ? 'bg-red-500/20 text-red-300' :
                      item.phase.intensity === 'high' ? 'bg-yellow-500/20 text-yellow-300' :
                      item.phase.intensity === 'medium' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {getIntensityLabel(item.phase.intensity)}
                    </span>
                    {isMaxPhase && (
                      <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium">
                        Пик
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-white/70 mb-2 break-words">{item.phase.description}</p>
                {item.phase.benefits.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.phase.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-white/60">
                        <CheckCircle2 className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Кнопка скачать PDF */}
      <button
        onClick={downloadPDF}
        disabled={downloading}
        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        {downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
            <span>Создание PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Скачать план в PDF</span>
          </>
        )}
      </button>
    </motion.div>
  )
}

