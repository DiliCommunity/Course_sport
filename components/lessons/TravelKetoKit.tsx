'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Luggage, Plus, Trash2, Copy, Check, Download, CheckCircle2, Plane, ShoppingCart } from 'lucide-react'

interface TravelItem {
  id: string
  name: string
  category: 'snacks' | 'meals' | 'drinks' | 'supplements'
  checked: boolean
}

const DEFAULT_ITEMS: TravelItem[] = [
  // Закуски
  { id: '1', name: 'Орехи (миндаль, макадамия)', category: 'snacks', checked: false },
  { id: '2', name: 'Вяленое мясо (джерки)', category: 'snacks', checked: false },
  { id: '3', name: 'Сырные палочки', category: 'snacks', checked: false },
  { id: '4', name: 'Оливки', category: 'snacks', checked: false },
  { id: '5', name: 'Семечки', category: 'snacks', checked: false },
  
  // Еда
  { id: '6', name: 'Консервы (тунец, сардины)', category: 'meals', checked: false },
  { id: '7', name: 'Колбаса/сосиски', category: 'meals', checked: false },
  { id: '8', name: 'Авокадо', category: 'meals', checked: false },
  { id: '9', name: 'Яйца вареные', category: 'meals', checked: false },
  
  // Напитки
  { id: '10', name: 'Электролиты (порошок)', category: 'drinks', checked: false },
  { id: '11', name: 'Кофе растворимый', category: 'drinks', checked: false },
  { id: '12', name: 'Стевия', category: 'drinks', checked: false },
  
  // Добавки
  { id: '13', name: 'Магний', category: 'supplements', checked: false },
  { id: '14', name: 'МСТ масло (порционные)', category: 'supplements', checked: false },
]

const CATEGORY_LABELS = {
  snacks: '🥜 Закуски',
  meals: '🍽️ Еда',
  drinks: '🥤 Напитки',
  supplements: '💊 Добавки'
}

const TRAVEL_TIPS = [
  'В самолете: закажите низкоуглеводное питание заранее',
  'В аэропорту: ищите салаты, яйца, бекон в кафе',
  'В отеле: используйте мини-бар для хранения продуктов',
  'В магазине: покупайте яйца, сыр, колбасу, орехи',
  'Всегда носите с собой орехи и вяленое мясо'
]

export function TravelKetoKit() {
  const [items, setItems] = useState<TravelItem[]>(DEFAULT_ITEMS)
  const [newItem, setNewItem] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TravelItem['category']>('snacks')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const addItem = () => {
    if (!newItem.trim()) return
    
    const newTravelItem: TravelItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      category: selectedCategory,
      checked: false
    }
    
    setItems([...items, newTravelItem])
    setNewItem('')
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const copyList = () => {
    const checkedItems = items.filter(item => item.checked)
    const uncheckedItems = items.filter(item => !item.checked)
    
    let text = '📋 КЕТО-НАБОР ДЛЯ ПУТЕШЕСТВИЙ\n\n'
    
    if (checkedItems.length > 0) {
      text += '✅ ВЗЯТЬ С СОБОЙ:\n'
      const categories = Object.keys(CATEGORY_LABELS) as TravelItem['category'][]
      categories.forEach(category => {
        const categoryItems = checkedItems.filter(item => item.category === category)
        if (categoryItems.length > 0) {
          text += `\n${CATEGORY_LABELS[category]}:\n`
          categoryItems.forEach(item => {
            text += `✓ ${item.name}\n`
          })
        }
      })
    }
    
    if (uncheckedItems.length > 0) {
      text += '\n📝 ДОПОЛНИТЕЛЬНО:\n'
      uncheckedItems.forEach(item => {
        text += `☐ ${item.name}\n`
      })
    }
    
    text += '\n💡 СОВЕТЫ:\n'
    TRAVEL_TIPS.forEach((tip, index) => {
      text += `${index + 1}. ${tip}\n`
    })
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    try {
      setDownloading(true)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      const dpi = 300
      const mmToPx = dpi / 25.4
      const pageWidthMm = 210
      const pageHeightMm = 297
      const pageWidthPx = pageWidthMm * mmToPx
      const pageHeightPx = pageHeightMm * mmToPx

      canvas.width = pageWidthPx
      canvas.height = pageHeightPx

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const marginPx = 20 * mmToPx
      let yPosPx = 25 * mmToPx

      // Заголовок
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Кето-набор для путешествий', pageWidthPx / 2, yPosPx)
      yPosPx += 50

      // Список продуктов
      const checkedItems = items.filter(item => item.checked)
      const categories = Object.keys(CATEGORY_LABELS) as TravelItem['category'][]
      
      ctx.textAlign = 'left'
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.fillText('Взять с собой:', marginPx, yPosPx)
      yPosPx += 35

      ctx.fillStyle = '#000000'
      ctx.font = '18px Arial, sans-serif'
      
      categories.forEach(category => {
        const categoryItems = checkedItems.filter(item => item.category === category)
        if (categoryItems.length > 0) {
          ctx.fillStyle = '#3b82f6'
          ctx.font = 'bold 20px Arial, sans-serif'
          ctx.fillText(CATEGORY_LABELS[category], marginPx, yPosPx)
          yPosPx += 30

          ctx.fillStyle = '#000000'
          ctx.font = '18px Arial, sans-serif'
          categoryItems.forEach(item => {
            if (yPosPx > pageHeightPx - 100) return
            ctx.fillText(`✓ ${item.name}`, marginPx + 10, yPosPx)
            yPosPx += 28
          })
          yPosPx += 10
        }
      })

      yPosPx += 20
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.fillText('Советы:', marginPx, yPosPx)
      yPosPx += 35

      ctx.fillStyle = '#000000'
      ctx.font = '18px Arial, sans-serif'
      TRAVEL_TIPS.forEach((tip, index) => {
        if (yPosPx > pageHeightPx - 50) return
        ctx.fillText(`${index + 1}. ${tip}`, marginPx + 10, yPosPx)
        yPosPx += 30
      })

      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm)
      pdf.save(`Кето-набор-путешествие-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл.')
    }
  }

  const groupByCategory = (itemsList: TravelItem[]) => {
    const grouped: Record<string, TravelItem[]> = {}
    itemsList.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })
    return grouped
  }

  const categories = groupByCategory(items)
  const checkedCount = items.filter(item => item.checked).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-accent-electric/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-electric/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-teal flex items-center justify-center shadow-lg shadow-accent-electric/30 flex-shrink-0">
          <Luggage className="w-5 h-5 sm:w-6 sm:h-6 text-dark-900" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Кето-набор для путешествий</h3>
          <p className="text-white/60 text-xs sm:text-sm">Полный список продуктов и стратегии для разных стран</p>
        </div>
      </div>

      {/* Добавление нового элемента */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="Название продукта"
            className="w-full md:col-span-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric/50 text-sm"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TravelItem['category'])}
            className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-electric/50 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-dark-800">{label}</option>
            ))}
          </select>
          <button
            onClick={addItem}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:hidden md:inline">Добавить</span>
            <span className="hidden sm:inline md:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Список продуктов по категориям */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
          const categoryItems = categories[category] || []
          if (categoryItems.length === 0) return null
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 shadow-sm"
            >
              <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                <span className="text-lg sm:text-xl">{label.split(' ')[0]}</span>
                <span>{label.split(' ').slice(1).join(' ')}</span>
              </h4>
              <div className="space-y-1.5 sm:space-y-2">
                {categoryItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex-shrink-0">
                      {item.checked ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-5 sm:h-5 text-accent-mint" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm break-words ${item.checked ? 'line-through text-white/40' : 'text-white'}`}>
                        {item.name}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                      className="p-1.5 sm:p-1 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 text-red-400 transition-all z-10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Советы */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-accent-electric/10 to-accent-teal/10 border border-accent-electric/20">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-accent-electric flex-shrink-0" />
          <h4 className="text-base sm:text-lg font-semibold text-white">Советы для путешествий:</h4>
        </div>
        <ul className="space-y-1.5 sm:space-y-2">
          {TRAVEL_TIPS.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-white/80 text-xs sm:text-sm leading-relaxed">
              <span className="text-accent-electric mt-1 flex-shrink-0">•</span>
              <span className="break-words">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Статистика и кнопки */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10">
          <div>
            <div className="text-white/60 text-xs sm:text-sm">Выбрано:</div>
            <div className="text-xl sm:text-2xl font-bold text-accent-electric">{checkedCount} / {items.length}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={copyList}
            className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-accent-mint" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="whitespace-nowrap">Скопировать список</span>
              </>
            )}
          </button>
          
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-electric/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                <span>PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="whitespace-nowrap">Скачать PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

