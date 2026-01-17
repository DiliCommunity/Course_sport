'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, Trophy, TrendingUp, Calculator, FileText, Download, 
  Save, Calendar, X, ChevronLeft, ChevronRight, Sparkles,
  BookOpen, Heart, Zap, BarChart3, Plus, Edit2, Trash2
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/components/providers/AuthProvider'

interface TrackerEntry {
  id: string
  date: string
  goals?: string
  results?: string
  successes?: string
  calculations?: string
  notes?: string
  module_data?: {
    weight?: number
    macros?: {
      proteins?: number
      fats?: number
      carbs?: number
      calories?: number
    }
    energy?: number
    mood?: number
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
}

interface ProgressNotesTrackerProps {
  courseId?: string
}

export function ProgressNotesTracker({ courseId }: ProgressNotesTrackerProps) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<TrackerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TrackerEntry | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({})

  const [newEntry, setNewEntry] = useState<TrackerEntry>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    goals: '',
    results: '',
    successes: '',
    calculations: '',
    notes: '',
    module_data: {}
  })

  // Загрузка записей из API
  useEffect(() => {
    if (user) {
      loadEntries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId, dateFilter])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(courseId && { course_id: courseId }),
        ...(dateFilter.start && { start_date: dateFilter.start }),
        ...(dateFilter.end && { end_date: dateFilter.end })
      })
      
      const response = await fetch(`/api/tracker/entries?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveEntry = async (entry: TrackerEntry) => {
    if (!user) return

    try {
      setSaving(true)
      const isEdit = entry.id && entries.some(e => e.id === entry.id)
      
      const response = await fetch('/api/tracker/entries', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...entry,
          ...(courseId && { course_id: courseId })
        })
      })

      if (response.ok) {
        await loadEntries()
        setShowAddForm(false)
        setSelectedEntry(null)
        setNewEntry({
          id: '',
          date: new Date().toISOString().split('T')[0],
          goals: '',
          results: '',
          successes: '',
          calculations: '',
          notes: '',
          module_data: {}
        })
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

  const deleteEntry = async (id: string) => {
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

  const handleAddEntry = () => {
    setNewEntry({
      id: '',
      date: new Date().toISOString().split('T')[0],
      goals: '',
      results: '',
      successes: '',
      calculations: '',
      notes: '',
      module_data: {}
    })
    setSelectedEntry(null)
    setShowAddForm(true)
  }

  const handleEditEntry = (entry: TrackerEntry) => {
    setNewEntry(entry)
    setSelectedEntry(entry)
    setShowAddForm(true)
  }

  const downloadPDF = async () => {
    if (entries.length === 0) {
      alert('Нет записей для скачивания')
      return
    }

    try {
      setDownloading(true)
      const element = document.getElementById('tracker-content')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0b'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Трекер_прогресса_${new Date().toISOString().split('T')[0]}.pdf`
      
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
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Ошибка при создании PDF')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full space-y-6">
      {/* Мотивационный текст */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 md:p-8 border-2 border-accent-gold/30 bg-gradient-to-br from-accent-gold/10 via-transparent to-accent-electric/10"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-4">
              Сила анализа: ваш маяк во времени
            </h3>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Каждый день вы совершаете маленькое, но очень важное чудо — фиксируете в трекере свои состояния, мысли и шаги. Это драгоценные зерна правды о вас и вашем пути. Но что происходит с этими зернами дальше?
              </p>
              <p>
                Сегодня мы поговорим о магии, которая превращает россыпь дней в ясную картину. О силе, которая делает вас не просто наблюдателем, а мудрым архитектором своей жизни. Эту силу зовут <strong className="text-accent-gold">Анализ</strong>.
              </p>
              <p>
                <strong className="text-accent-electric">Сила момента: ваш маяк во времени</strong><br />
                Жизнь течет, как река. Нельзя дважды войти в одну воду, но можно научиться понимать её течение. Анализ — это ваш персональный маяк в конкретный промежуток времени: неделя, месяц, сезон. Он мягко освещает вам вопрос: «Что на самом деле происходило со мной здесь и сейчас?»
              </p>
              <p>
                Это не взгляд назад с упреком, а взгляд с добротой и интересом. Вы даете себе право увидеть период целостно, со всеми его подъемами, паузами и оттенками.
              </p>
              <p>
                <strong className="text-accent-mint">Точная картина: от точек к узорам</strong><br />
                Без анализа наш ум любит рисовать картины, основанные на последней эмоции, самом ярком впечатлении или случайной детали. Это как судить о целом фильме по одному кадру.
              </p>
              <p>
                Анализ ваших трекерных записей дарит вам нечто гораздо большее — точное понимание общей картины. Вы перестаете видеть отдельные точки «было трудно» или «было здорово». Вы начинаете видеть узоры, связи, ритмы.
              </p>
              <p>
                Вы обнаруживаете, что энергия падает не «просто так», а после определенных дел. Что радость приходит не случайно, а следуя за конкретными практиками. Вы видите себя в объеме и в контексте.
              </p>
              <p>
                <strong className="text-accent-neon">Грациозное управление: сила осознанного выбора</strong><br />
                И вот, когда картина ясна, рождается ваша тихая сила — сила осознанного выбора.
              </p>
              <p>
                Теперь вы можете осознанно усиливать то, что наполняет, и бережно отпускать то, что истощает.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Усиливать наполняющее</strong> — это не слепой эксперимент, а целенаправленное, любящее действие. Вы точно знаете, какие ритуалы, люди или занятия были для вас тем самым светом в этом периоде. И вы бережно вплетаете их в ткань следующих дней.</li>
                <li><strong>Отпускать истощающее</strong> — это не суровое отсечение, а акт заботы о себе. Вы с благодарностью и тактом освобождаете пространство от того, что отнимало энергию и не служило вашей гармонии. Вы расчищаете путь для того, что действительно важно.</li>
              </ul>
              <p className="text-accent-gold font-semibold text-lg mt-4">
                Это большая сила. Анализ — это не сухая «обработка данных». Это большая и добрая сила.
              </p>
              <p>
                Это сила понимания себя вместо осуждения. Сила управления своей жизнью вместо следования течению. Сила созидания своего благополучия по кирпичику, день за днем.
              </p>
              <p>
                Вы — и исследователь, и художник, и садовник своей внутренней вселенной. Трекер — ваш дневник наблюдений. Анализ — волшебная лупа, которая помогает вам читать его мудрые записи.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Панель управления */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAddEntry}
            className="px-4 py-2 bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold rounded-xl hover:shadow-lg hover:shadow-accent-teal/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Новая запись
          </button>
          <button
            onClick={downloadPDF}
            disabled={downloading || entries.length === 0}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Создание PDF...' : 'Скачать PDF'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter.start || ''}
            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
            placeholder="От"
          />
          <input
            type="date"
            value={dateFilter.end || ''}
            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
            placeholder="До"
          />
          {(dateFilter.start || dateFilter.end) && (
            <button
              onClick={() => setDateFilter({})}
              className="px-3 py-2 text-white/60 hover:text-white text-sm"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Форма добавления/редактирования */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border-2 border-accent-teal/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {selectedEntry ? 'Редактировать запись' : 'Новая запись'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setSelectedEntry(null)
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm font-medium">
                  Дата
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-gold" />
                  Цели
                </label>
                <textarea
                  value={newEntry.goals || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, goals: e.target.value })}
                  placeholder="Опишите ваши цели на этот период..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-electric" />
                  Результаты
                </label>
                <textarea
                  value={newEntry.results || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, results: e.target.value })}
                  placeholder="Зафиксируйте ваши результаты (вес, измерения, показатели)..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent-mint" />
                  Успехи
                </label>
                <textarea
                  value={newEntry.successes || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, successes: e.target.value })}
                  placeholder="Отметьте ваши успехи и достижения..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-accent-neon" />
                  Подсчеты
                </label>
                <textarea
                  value={newEntry.calculations || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, calculations: e.target.value })}
                  placeholder="Ваши расчеты макросов, калорий, интервалов голодания и т.д...."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-teal" />
                  Заметки
                </label>
                <textarea
                  value={newEntry.notes || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Ваши мысли, наблюдения, инсайты..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 min-h-[150px] resize-y"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => saveEntry(newEntry)}
                  disabled={saving || !newEntry.date}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold rounded-xl hover:shadow-lg hover:shadow-accent-teal/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedEntry(null)
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список записей */}
      <div id="tracker-content" className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-teal"></div>
            <p className="text-white/60 mt-4">Загрузка записей...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Пока нет записей</p>
            <p className="text-white/40 text-sm mt-2">Создайте первую запись, чтобы начать отслеживать свой прогресс</p>
          </div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-accent-teal/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-accent-teal" />
                  <span className="text-white font-semibold">
                    {formatDate(entry.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4 text-white/60 hover:text-accent-teal" />
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 text-white/60 hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.goals && (
                  <div className="p-4 bg-accent-gold/10 rounded-xl border border-accent-gold/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-accent-gold" />
                      <h4 className="font-semibold text-white text-sm">Цели</h4>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.goals}</p>
                  </div>
                )}

                {entry.results && (
                  <div className="p-4 bg-accent-electric/10 rounded-xl border border-accent-electric/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-accent-electric" />
                      <h4 className="font-semibold text-white text-sm">Результаты</h4>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.results}</p>
                  </div>
                )}

                {entry.successes && (
                  <div className="p-4 bg-accent-mint/10 rounded-xl border border-accent-mint/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-accent-mint" />
                      <h4 className="font-semibold text-white text-sm">Успехи</h4>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.successes}</p>
                  </div>
                )}

                {entry.calculations && (
                  <div className="p-4 bg-accent-neon/10 rounded-xl border border-accent-neon/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-accent-neon" />
                      <h4 className="font-semibold text-white text-sm">Подсчеты</h4>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.calculations}</p>
                  </div>
                )}
              </div>

              {entry.notes && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-accent-teal" />
                    <h4 className="font-semibold text-white text-sm">Заметки</h4>
                  </div>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{entry.notes}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

