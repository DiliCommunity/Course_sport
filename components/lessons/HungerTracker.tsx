'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Brain, Clock, TrendingUp, Download, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/components/providers/AuthProvider'

interface HungerEntry {
  id: string
  time: string
  type: 'physical' | 'psychological'
  intensity: number // 1-10
  trigger?: string
  notes?: string
  handled: boolean
}

const HUNGER_TYPES = {
  physical: {
    label: 'Физический голод',
    icon: Heart,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    description: 'Нарастает постепенно, урчание в животе, любая еда подойдет'
  },
  psychological: {
    label: 'Психологический голод',
    icon: Brain,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    description: 'Возникает резко, хочется конкретной еды, связан со скукой/стрессом'
  }
}

const COMMON_TRIGGERS = [
  'Стресс',
  'Скука',
  'Усталость',
  'Эмоции',
  'Привычка',
  'Время приема пищи',
  'Запах еды',
  'Социальная ситуация'
]

export function HungerTracker() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<HungerEntry[]>([])
  const [currentType, setCurrentType] = useState<'physical' | 'psychological'>('physical')
  const [currentIntensity, setCurrentIntensity] = useState(5)
  const [currentTrigger, setCurrentTrigger] = useState('')
  const [customTrigger, setCustomTrigger] = useState('')
  const [notes, setNotes] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Загрузка записей из API
  useEffect(() => {
    if (user) {
      loadEntries()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tracker/entries', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Преобразуем записи из API в формат HungerEntry
        const transformedEntries: HungerEntry[] = (data.entries || [])
          .filter((e: any) => e.module_data && e.module_data.hungerType)
          .map((e: any) => ({
            id: e.id,
            time: e.module_data.time || new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            type: e.module_data.hungerType,
            intensity: e.module_data.intensity || 5,
            trigger: e.module_data.trigger,
            notes: e.notes,
            handled: e.module_data.handled || false
          }))
          .sort((a: HungerEntry, b: HungerEntry) => {
            // Сортируем по времени (строки HH:MM)
            const timeA = a.time.split(':').map(Number)
            const timeB = b.time.split(':').map(Number)
            const dateA = timeA[0] * 60 + timeA[1]
            const dateB = timeB[0] * 60 + timeB[1]
            return dateB - dateA
          })
        setEntries(transformedEntries)
      }
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveEntry = async (entry: HungerEntry) => {
    if (!user) return

    try {
      setSaving(true)
      const isEdit = entry.id && entries.some(e => e.id === entry.id)
      const currentDate = new Date().toISOString().split('T')[0]
      
      const response = await fetch('/api/tracker/entries', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: entry.id,
          date: currentDate,
          notes: entry.notes || null,
          module_data: {
            hungerType: entry.type,
            intensity: entry.intensity,
            trigger: entry.trigger,
            time: entry.time,
            handled: entry.handled
          },
          course_id: null // Hunger tracker не привязан к курсу
        })
      })

      if (response.ok) {
        await loadEntries()
        setShowAddForm(false)
        setCurrentIntensity(5)
        setCurrentTrigger('')
        setCustomTrigger('')
        setNotes('')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Ошибка при сохранении записи')
    } finally {
      setSaving(false)
    }
  }

  const addEntry = async () => {
    const newEntry: HungerEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      type: currentType,
      intensity: currentIntensity,
      trigger: currentTrigger || customTrigger || undefined,
      notes: notes || undefined,
      handled: false
    }
    await saveEntry(newEntry)
  }

  const toggleHandled = async (id: string) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    
    const updatedEntry = { ...entry, handled: !entry.handled }
    await saveEntry(updatedEntry)
  }

  const removeEntry = async (id: string) => {
    if (!confirm('Удалить эту запись?')) return

    try {
      const response = await fetch(`/api/tracker/entries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await loadEntries()
      } else {
        alert('Ошибка при удалении записи')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Ошибка при удалении записи')
    }
  }

  const getStats = () => {
    const total = entries.length
    const physical = entries.filter(e => e.type === 'physical').length
    const psychological = entries.filter(e => e.type === 'psychological').length
    const handled = entries.filter(e => e.handled).length
    const avgIntensity = total > 0 
      ? Math.round(entries.reduce((sum, e) => sum + e.intensity, 0) / total)
      : 0
    
    const triggers: Record<string, number> = {}
    entries.forEach(e => {
      if (e.trigger) {
        triggers[e.trigger] = (triggers[e.trigger] || 0) + 1
      }
    })
    const topTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0]

    return { total, physical, psychological, handled, avgIntensity, topTrigger }
  }

  const stats = getStats()

  const downloadPDF = async () => {
    if (entries.length === 0) {
      alert('Нет записей для экспорта')
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

      const topTriggerHtml = stats.topTrigger 
        ? `<p style="margin: 8px 0; font-size: 15px; color: rgba(255, 255, 255, 0.9);">🎯 Частый триггер: <strong style="color: #3b82f6">${stats.topTrigger[0]}</strong> (${stats.topTrigger[1]} раз)</p>`
        : ''

      const entriesHtml = entries.map((entry, index) => {
        const typeLabel = entry.type === 'physical' ? 'Физический' : 'Психологический'
        const typeColor = entry.type === 'physical' ? '#10b981' : '#ec4899'
        const triggerHtml = entry.trigger ? `<p style="margin: 5px 0; font-size: 14px; color: rgba(255, 255, 255, 0.7);">💡 Триггер: ${entry.trigger}</p>` : ''
        const notesHtml = entry.notes ? `<p style="margin: 5px 0; font-size: 14px; color: rgba(255, 255, 255, 0.7);">📝 ${entry.notes}</p>` : ''
        const handledColor = entry.handled ? '#10b981' : '#ff6b35'
        const handledText = entry.handled ? '✓ Справлено' : '✗ Не справлено'
        return `
          <div style="
            margin-bottom: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid ${typeColor}40;
            border-radius: 12px;
            backdrop-filter: blur(10px);
          ">
            <p style="font-size: 16px; color: ${typeColor}; font-weight: bold; margin-bottom: 8px;">
              ${index + 1}. ${entry.time} - ${typeLabel} (${entry.intensity}/10)
            </p>
            ${triggerHtml}
            ${notesHtml}
            <p style="margin: 5px 0; font-size: 14px; color: ${handledColor}; font-weight: bold;">${handledText}</p>
          </div>
        `
      }).join('')

      printContent.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(59, 130, 246, 0.1);
        ">
          <h1 style="
            font-size: 42px;
            font-weight: bold;
            text-align: center;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: #3b82f6;
            text-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 2px 10px rgba(0, 0, 0, 0.5);
          ">
            Трекер голода
          </h1>
          <p style="text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 16px; margin: 0 0 40px 0; text-transform: uppercase; letter-spacing: 2px;">
            Период: ${new Date().toLocaleDateString('ru-RU')}
          </p>
          
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 35px;
            backdrop-filter: blur(10px);
          ">
            <h3 style="font-size: 20px; color: #3b82f6; margin-bottom: 15px; font-weight: bold;">📊 Статистика:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">Всего записей</div>
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.total}</div>
              </div>
              <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">Физический</div>
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.physical} (${Math.round(stats.physical / stats.total * 100)}%)</div>
              </div>
              <div style="background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">Психологический</div>
                <div style="font-size: 24px; font-weight: bold; color: #ec4899;">${stats.psychological} (${Math.round(stats.psychological / stats.total * 100)}%)</div>
              </div>
              <div style="background: rgba(255, 107, 53, 0.15); border: 1px solid rgba(255, 107, 53, 0.3); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">Справлено</div>
                <div style="font-size: 24px; font-weight: bold; color: #ff6b35;">${stats.handled}</div>
              </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 5px 0; font-size: 15px; color: rgba(255, 255, 255, 0.9);">Средняя интенсивность: <strong style="color: #3b82f6">${stats.avgIntensity}/10</strong></p>
              ${topTriggerHtml}
            </div>
          </div>
          
          <h2 style="
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            <span style="font-size: 28px;">📋</span>
            Записи:
          </h2>
          <div>
            ${entriesHtml}
          </div>
        </div>
      `

      // Добавляем элемент в DOM
      document.body.appendChild(printContent)

      // Используем html2canvas для создания изображения
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
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Если изображение больше одной страницы, разбиваем на несколько страниц
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let yPosition = 0
        
        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight)
          heightLeft -= pageHeight
          
          if (heightLeft > 0) {
            pdf.addPage()
            yPosition -= pageHeight
          }
        }
      }

      const fileName = `Трекер-голода-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      
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
      
      // Удаляем ссылку и очищаем blob URL через задержку
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(blobUrl)
      }, 1000)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-dark-800/50 to-purple-500/10 border-2 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Heart className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Трекер голода</h3>
          <p className="text-white/60 text-xs sm:text-sm">Отслеживайте физический и психологический голод</p>
        </div>
      </div>

      {/* Статистика */}
      {entries.length > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <div className="text-xs sm:text-sm text-white/60 mb-1">Всего</div>
              <div className="text-lg sm:text-xl font-bold text-white">{stats.total}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-white/60 mb-1">Физический</div>
              <div className="text-lg sm:text-xl font-bold text-red-400">{stats.physical}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-white/60 mb-1">Психологический</div>
              <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.psychological}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-white/60 mb-1">Средняя интенсивность</div>
              <div className="text-lg sm:text-xl font-bold text-white">{stats.avgIntensity}/10</div>
            </div>
          </div>
          {stats.topTrigger && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs sm:text-sm text-white/60">Частый триггер:</div>
              <div className="text-sm sm:text-base font-medium text-white mt-1">
                {stats.topTrigger[0]} ({stats.topTrigger[1]} раз)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Форма добавления */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-4 sm:mb-6 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Добавить запись</span>
        </button>
      ) : (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-bold text-white">Новая запись</h4>
            <button
              onClick={() => {
                setShowAddForm(false)
                setCurrentIntensity(5)
                setCurrentTrigger('')
                setCustomTrigger('')
                setNotes('')
              }}
              className="p-1 rounded-lg hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Тип голода */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Тип голода:</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(HUNGER_TYPES).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={key}
                    onClick={() => setCurrentType(key as 'physical' | 'psychological')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      currentType === key
                        ? `${config.bg} ${config.border}`
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${currentType === key ? config.color : 'text-white/60'} mx-auto mb-2`} />
                    <div className={`text-xs font-medium ${currentType === key ? config.color : 'text-white/60'}`}>
                      {config.label}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-white/50">
              {HUNGER_TYPES[currentType].description}
            </p>
          </div>

          {/* Интенсивность */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">
              Интенсивность: {currentIntensity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentIntensity}
              onChange={(e) => setCurrentIntensity(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-blue-500"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>Слабый</span>
              <span>Сильный</span>
            </div>
          </div>

          {/* Триггер */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Триггер (опционально):</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
              {COMMON_TRIGGERS.map(trigger => (
                <button
                  key={trigger}
                  onClick={() => {
                    setCurrentTrigger(currentTrigger === trigger ? '' : trigger)
                    setCustomTrigger('')
                  }}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    currentTrigger === trigger
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customTrigger}
              onChange={(e) => {
                setCustomTrigger(e.target.value)
                setCurrentTrigger('')
              }}
              placeholder="Или введите свой триггер..."
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 text-xs sm:text-sm"
            />
          </div>

          {/* Заметки */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Заметки:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Что вы чувствовали? Как справились?"
              rows={3}
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 text-xs sm:text-sm resize-none"
            />
          </div>

          <button
            onClick={addEntry}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-dark-900 font-medium hover:shadow-lg transition-all text-sm sm:text-base"
          >
            Сохранить запись
          </button>
        </div>
      )}

      {/* Список записей */}
      {entries.length > 0 && (
        <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-bold text-white">История записей:</h4>
            <span className="text-xs sm:text-sm text-white/60">{entries.length} записей</span>
          </div>
          {entries.slice().reverse().map((entry) => {
            const config = HUNGER_TYPES[entry.type]
            const Icon = config.icon
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 sm:p-4 rounded-xl border-2 ${config.bg} ${config.border} ${
                  entry.handled ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm sm:text-base font-bold text-white">{entry.time}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs sm:text-sm text-white/60">
                          Интенсивность: {entry.intensity}/10
                        </span>
                      </div>
                      {entry.trigger && (
                        <div className="text-xs sm:text-sm text-white/70 mb-1">
                          Триггер: {entry.trigger}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="text-xs sm:text-sm text-white/60 break-words mt-1">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleHandled(entry.id)}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                        entry.handled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-1.5 sm:p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Кнопка скачать PDF */}
      {entries.length > 0 && (
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              <span>Создание PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Скачать отчет в PDF</span>
            </>
          )}
        </button>
      )}

      {entries.length === 0 && !showAddForm && (
        <div className="p-6 sm:p-8 text-center rounded-xl bg-white/5 border border-white/10">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-3 sm:mb-4" />
          <p className="text-white/60 text-sm sm:text-base mb-2">Нет записей</p>
          <p className="text-white/40 text-xs sm:text-sm">Начните отслеживать свой голод для лучшего понимания паттернов</p>
        </div>
      )}
    </motion.div>
  )
}

