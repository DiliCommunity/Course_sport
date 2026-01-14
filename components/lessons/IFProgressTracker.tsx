'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Download, Plus, X, Calendar, Target, BarChart3, Zap, Moon, Brain, Scale } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface ProgressEntry {
  id: string
  date: string
  weight?: number
  energy: number // 1-10
  sleep: number // 1-10
  focus: number // 1-10
  notes?: string
}

const DEFAULT_ENTRIES: ProgressEntry[] = []

export function IFProgressTracker() {
  const [entries, setEntries] = useState<ProgressEntry[]>(DEFAULT_ENTRIES)
  const [showAddForm, setShowAddForm] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
  const [newEntry, setNewEntry] = useState<ProgressEntry>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    energy: 5,
    sleep: 5,
    focus: 5,
  })

  const addEntry = () => {
    if (!newEntry.date) return
    
    const entry: ProgressEntry = {
      ...newEntry,
      id: Date.now().toString(),
    }
    
    // Проверяем, есть ли уже запись на эту дату
    const existingIndex = entries.findIndex(e => e.date === entry.date)
    if (existingIndex >= 0) {
      setEntries(entries.map((e, i) => i === existingIndex ? entry : e))
    } else {
      setEntries([...entries, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    }
    
    setNewEntry({
      id: '',
      date: new Date().toISOString().split('T')[0],
      energy: 5,
      sleep: 5,
      focus: 5,
    })
    setShowAddForm(false)
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id))
  }

  const getStats = () => {
    if (entries.length === 0) return null

    const total = entries.length
    const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / total
    const avgSleep = entries.reduce((sum, e) => sum + e.sleep, 0) / total
    const avgFocus = entries.reduce((sum, e) => sum + e.focus, 0) / total
    
    const weightEntries = entries.filter(e => e.weight !== undefined)
    const weightChange = weightEntries.length >= 2
      ? weightEntries[weightEntries.length - 1].weight! - weightEntries[0].weight!
      : 0
    
    const firstWeight = weightEntries[0]?.weight
    const lastWeight = weightEntries[weightEntries.length - 1]?.weight

    return {
      total,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgFocus: Math.round(avgFocus * 10) / 10,
      weightChange,
      firstWeight,
      lastWeight,
      weightEntries: weightEntries.length
    }
  }

  const stats = getStats()

  const getTrendIcon = (value: number, reverse: boolean = false) => {
    if (value > 0) return reverse ? <TrendingDown className="w-4 h-4 text-red-400" /> : <TrendingUp className="w-4 h-4 text-green-400" />
    if (value < 0) return reverse ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />
    return null
  }

  const downloadPDF = async () => {
    if (entries.length === 0) {
      alert('Нет записей для экспорта')
      return
    }

    try {
      setDownloading(true)

      const dateRange = entries.length > 0 
        ? `${entries[0].date} - ${entries[entries.length - 1].date}`
        : new Date().toLocaleDateString('ru-RU')

      // Создаем временный HTML элемент для PDF
      const printContent = document.createElement('div')
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '40px'
      printContent.style.backgroundColor = '#ffffff'
      printContent.style.fontFamily = 'Arial, sans-serif'
      printContent.style.color = '#000000'

      const statsHtml = stats ? `
        <div style="margin-bottom: 25px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
          <h3 style="font-size: 16px; color: #a855f7; margin-bottom: 10px;">Статистика:</h3>
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">Всего записей: ${stats.total}</p>
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">Средняя энергия: ${stats.avgEnergy}/10</p>
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">Средний сон: ${stats.avgSleep}/10</p>
          <p style="margin: 5px 0; font-size: 13px; color: #000000;">Средний фокус: ${stats.avgFocus}/10</p>
          ${stats.weightEntries >= 2 ? `
            <p style="margin: 5px 0; font-size: 13px; color: #000000;">Изменение веса: ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)} кг</p>
            <p style="margin: 5px 0; font-size: 13px; color: #000000;">Начальный вес: ${stats.firstWeight} кг</p>
            <p style="margin: 5px 0; font-size: 13px; color: #000000;">Текущий вес: ${stats.lastWeight} кг</p>
          ` : ''}
        </div>
      ` : ''

      const entriesHtml = entries.map((entry, index) => {
        const date = new Date(entry.date).toLocaleDateString('ru-RU')
        const weightHtml = entry.weight ? `<p style="margin: 3px 0; font-size: 12px; color: #666666;">Вес: ${entry.weight} кг</p>` : ''
        const notesHtml = entry.notes ? `<p style="margin: 3px 0; font-size: 12px; color: #666666;">Заметки: ${entry.notes}</p>` : ''
        return `
          <div style="margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #000000; font-weight: bold; margin-bottom: 5px;">${index + 1}. ${date}</p>
            <p style="margin: 3px 0; font-size: 12px; color: #666666;">Энергия: ${entry.energy}/10 | Сон: ${entry.sleep}/10 | Фокус: ${entry.focus}/10</p>
            ${weightHtml}
            ${notesHtml}
          </div>
        `
      }).join('')

      printContent.innerHTML = `
        <h1 style="font-size: 32px; color: #a855f7; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #a855f7; padding-bottom: 10px;">
          Трекер прогресса IF
        </h1>
        <p style="text-align: center; color: #666666; font-size: 14px; margin-bottom: 30px;">
          Период: ${dateRange}
        </p>
        ${statsHtml}
        <h2 style="font-size: 18px; color: #a855f7; margin-bottom: 12px; margin-top: 25px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
          Записи:
        </h2>
        <div>
          ${entriesHtml}
        </div>
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

      const fileName = `IF-Прогресс-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    }
  }

  // Загружаем сохраненные данные из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('if-progress-tracker')
    if (saved) {
      try {
        setEntries(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved progress:', e)
      }
    }
  }, [])

  // Сохраняем данные в localStorage
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('if-progress-tracker', JSON.stringify(entries))
    }
  }, [entries])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-dark-800/50 to-pink-500/10 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Трекер прогресса IF</h3>
          <p className="text-white/60 text-xs sm:text-sm">Отслеживайте свой прогресс: вес, энергия, сон, фокус</p>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <div className="text-xs sm:text-sm text-white/60">Энергия</div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white">{stats.avgEnergy}/10</div>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                <div className="text-xs sm:text-sm text-white/60">Сон</div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white">{stats.avgSleep}/10</div>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <div className="text-xs sm:text-sm text-white/60">Фокус</div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white">{stats.avgFocus}/10</div>
            </div>
            {stats.weightEntries >= 2 && (
              <div className="p-2 sm:p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                  <div className="text-xs sm:text-sm text-white/60">Вес</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} кг
                  </div>
                  {getTrendIcon(stats.weightChange, true)}
                </div>
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm text-white/60">
            Всего записей: {stats.total} {stats.weightEntries >= 2 && `| Замеров веса: ${stats.weightEntries}`}
          </div>
        </div>
      )}

      {/* Форма добавления */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-4 sm:mb-6 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
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
                setNewEntry({
                  id: '',
                  date: new Date().toISOString().split('T')[0],
                  energy: 5,
                  sleep: 5,
                  focus: 5,
                })
              }}
              className="p-1 rounded-lg hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Дата:</label>
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>

          {/* Вес */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Вес (кг, опционально):</label>
            <input
              type="number"
              step="0.1"
              value={newEntry.weight || ''}
              onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Введите вес"
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>

          {/* Энергия */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">
              Энергия: {newEntry.energy}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newEntry.energy}
              onChange={(e) => setNewEntry({ ...newEntry, energy: Number(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-purple-500"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>Низкая</span>
              <span>Высокая</span>
            </div>
          </div>

          {/* Сон */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">
              Качество сна: {newEntry.sleep}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newEntry.sleep}
              onChange={(e) => setNewEntry({ ...newEntry, sleep: Number(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>Плохо</span>
              <span>Отлично</span>
            </div>
          </div>

          {/* Фокус */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">
              Фокус и ясность: {newEntry.focus}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newEntry.focus}
              onChange={(e) => setNewEntry({ ...newEntry, focus: Number(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-pink-500"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>Туман</span>
              <span>Ясно</span>
            </div>
          </div>

          {/* Заметки */}
          <div>
            <label className="block text-white/80 text-xs sm:text-sm font-medium mb-2">Заметки:</label>
            <textarea
              value={newEntry.notes || ''}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="Как вы себя чувствовали? Что заметили?"
              rows={3}
              className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-xs sm:text-sm resize-none"
            />
          </div>

          <button
            onClick={addEntry}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-dark-900 font-medium hover:shadow-lg transition-all text-sm sm:text-base"
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
            const date = new Date(entry.date).toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base font-bold text-white">{date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        <span className="text-xs sm:text-sm text-white/70">{entry.energy}/10</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                        <span className="text-xs sm:text-sm text-white/70">{entry.sleep}/10</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                        <span className="text-xs sm:text-sm text-white/70">{entry.focus}/10</span>
                      </div>
                    </div>
                    {entry.weight && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                        <span className="text-xs sm:text-sm text-white/70">Вес: {entry.weight} кг</span>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs sm:text-sm text-white/60 break-words mt-2">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
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
              <span>Скачать отчет в PDF</span>
            </>
          )}
        </button>
      )}

      {entries.length === 0 && !showAddForm && (
        <div className="p-6 sm:p-8 text-center rounded-xl bg-white/5 border border-white/10">
          <Target className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-3 sm:mb-4" />
          <p className="text-white/60 text-sm sm:text-base mb-2">Нет записей</p>
          <p className="text-white/40 text-xs sm:text-sm">Начните отслеживать свой прогресс для лучших результатов</p>
        </div>
      )}
    </motion.div>
  )
}

