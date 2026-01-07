'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UtensilsCrossed, Copy, Check, Download, MapPin, Languages } from 'lucide-react'

interface RestaurantType {
  id: string
  name: string
  icon: string
  phrases: string[]
  dishes: string[]
}

const RESTAURANT_TYPES: RestaurantType[] = [
  {
    id: 'italian',
    name: 'Итальянский',
    icon: '🍝',
    phrases: [
      'Можно без пасты, только мясо и овощи?',
      'Есть ли блюда без глютена?',
      'Можно заменить гарнир на овощи?',
      'Без хлеба, пожалуйста'
    ],
    dishes: [
      'Салат Цезарь (без сухариков)',
      'Стейк с овощами',
      'Курица гриль',
      'Морепродукты',
      'Сырная тарелка',
      'Овощи на гриле'
    ]
  },
  {
    id: 'asian',
    name: 'Азиатский',
    icon: '🍜',
    phrases: [
      'Можно без риса?',
      'Есть ли блюда без лапши?',
      'Можно без сладких соусов?',
      'Только мясо и овощи, пожалуйста'
    ],
    dishes: [
      'Сашими',
      'Терияки (без риса)',
      'Овощи вок',
      'Мясные шашлычки',
      'Рыба на пару',
      'Овощной салат'
    ]
  },
  {
    id: 'russian',
    name: 'Русский',
    icon: '🥘',
    phrases: [
      'Можно без картофеля?',
      'Есть ли блюда без круп?',
      'Можно заменить гарнир на овощи?',
      'Только мясо и салат, пожалуйста'
    ],
    dishes: [
      'Шашлык',
      'Рыба запеченная',
      'Салат овощной',
      'Мясо на гриле',
      'Сырная тарелка',
      'Овощи на гриле'
    ]
  },
  {
    id: 'cafe',
    name: 'Кафе',
    icon: '☕',
    phrases: [
      'Есть ли низкоуглеводные блюда?',
      'Можно без хлеба?',
      'Есть ли салаты?',
      'Кофе с жирными сливками, пожалуйста'
    ],
    dishes: [
      'Салат с курицей',
      'Омлет с овощами',
      'Яйца с беконом',
      'Авокадо тост (без хлеба)',
      'Сырная тарелка',
      'Орехи и сыр'
    ]
  }
]

export function RestaurantChecklist() {
  const [selectedType, setSelectedType] = useState<RestaurantType | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateText = () => {
    if (!selectedType) return ''
    
    let text = `📋 ЧЕК-ЛИСТ ДЛЯ РЕСТОРАНА: ${selectedType.name}\n\n`
    text += `💬 ГОТОВЫЕ ФРАЗЫ:\n`
    selectedType.phrases.forEach((phrase, index) => {
      text += `${index + 1}. ${phrase}\n`
    })
    text += `\n🍽️ КЕТО-ДРУЖЕЛЮБНЫЕ БЛЮДА:\n`
    selectedType.dishes.forEach((dish, index) => {
      text += `${index + 1}. ${dish}\n`
    })
    
    return text
  }

  const downloadPDF = async () => {
    if (!selectedType) return

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
      ctx.fillText(`Чек-лист для ресторана: ${selectedType.name}`, pageWidthPx / 2, yPosPx)
      yPosPx += 50

      // Готовые фразы
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Готовые фразы:', marginPx, yPosPx)
      yPosPx += 35

      ctx.fillStyle = '#000000'
      ctx.font = '18px Arial, sans-serif'
      selectedType.phrases.forEach((phrase, index) => {
        if (yPosPx > pageHeightPx - 100) return
        ctx.fillText(`${index + 1}. ${phrase}`, marginPx + 10, yPosPx)
        yPosPx += 30
      })
      yPosPx += 30

      // Блюда
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.fillText('Кето-дружелюбные блюда:', marginPx, yPosPx)
      yPosPx += 35

      ctx.fillStyle = '#000000'
      ctx.font = '18px Arial, sans-serif'
      selectedType.dishes.forEach((dish, index) => {
        if (yPosPx > pageHeightPx - 50) return
        ctx.fillText(`${index + 1}. ${dish}`, marginPx + 10, yPosPx)
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
      pdf.save(`Чек-лист-${selectedType.name}-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-gold/10 via-dark-800/50 to-accent-electric/10 border-2 border-accent-gold/30 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Чек-лист для ресторанов</h3>
          <p className="text-white/60 text-sm">Готовые фразы и списки блюд для разных типов ресторанов</p>
        </div>
      </div>

      {/* Выбор типа ресторана */}
      <div className="mb-6">
        <label className="block text-white/80 font-medium mb-3">Выберите тип ресторана:</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RESTAURANT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedType?.id === type.id
                  ? 'bg-gradient-to-r from-accent-gold to-accent-electric border-accent-gold text-dark-900'
                  : 'bg-white/5 border-white/10 text-white hover:border-accent-gold/30'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-medium text-sm">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Контент выбранного ресторана */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Готовые фразы */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-accent-gold" />
              <h4 className="text-lg font-semibold text-white">Готовые фразы для заказа:</h4>
            </div>
            <div className="space-y-3">
              {selectedType.phrases.map((phrase, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="text-accent-gold font-bold mt-0.5">{index + 1}.</span>
                  <p className="text-white/80 flex-1">{phrase}</p>
                  <button
                    onClick={() => copyToClipboard(phrase)}
                    className="p-2 rounded-lg hover:bg-accent-gold/20 transition-colors"
                    title="Скопировать"
                  >
                    <Copy className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Кето-дружелюбные блюда */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-accent-electric" />
              <h4 className="text-lg font-semibold text-white">Кето-дружелюбные блюда:</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedType.dishes.map((dish, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <Check className="w-4 h-4 text-accent-mint flex-shrink-0" />
                  <span className="text-white/80 text-sm">{dish}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard(generateText())}
              className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-accent-mint" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать весь чек-лист</span>
                </>
              )}
            </button>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Скачать PDF</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

