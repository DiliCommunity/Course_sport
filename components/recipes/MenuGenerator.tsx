'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, UtensilsCrossed, ShoppingCart, Download, Check, X, Sparkles, ChefHat } from 'lucide-react'
import Image from 'next/image'
import { ketoRecipesData } from './ketoRecipesData'

interface Meal {
  name: string
  calories: number
  fats: number
  proteins: number
  carbs: number
  prepTime: number
  image?: string
  ingredients?: string[]
  instructions?: string[]
}

interface DayMenu {
  day: string
  date?: string
  breakfast?: Meal
  lunch?: Meal
  dinner?: Meal
}

// База данных блюд - используем все рецепты из кето-рецептов
const MEALS_DATABASE: Record<string, Meal[]> = ketoRecipesData

// Список продуктов для исключения
const COMMON_PRODUCTS = [
  'Яйца',
  'Рыба',
  'Морепродукты',
  'Орехи',
  'Молочные продукты',
  'Помидоры',
  'Перец',
  'Грибы',
  'Авокадо',
  'Сыр',
  'Бекон',
  'Лосось',
  'Тунец',
  'Курица',
  'Говядина',
  'Индейка',
  'Креветки',
  'Шпинат',
  'Брокколи',
  'Цветная капуста',
]

export function MenuGenerator() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'full'>('full')
  const [productFilter, setProductFilter] = useState<'all' | 'exclude'>('all')
  const [excludedProducts, setExcludedProducts] = useState<string[]>([])
  const [targetCalories, setTargetCalories] = useState('2000')
  const [generatedMenu, setGeneratedMenu] = useState<DayMenu[]>([])
  const [downloading, setDownloading] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)

  // Фильтрация блюд по исключенным продуктам
  const filterMeals = (meals: Meal[]): Meal[] => {
    if (productFilter === 'all') {
      return meals
    }
    return meals.filter((meal) => {
      const mealIngredients = meal.ingredients?.join(' ') || ''
      return !excludedProducts.some((excluded) =>
        mealIngredients.toLowerCase().includes(excluded.toLowerCase())
      )
    })
  }

  // Генерация меню
  const generateMenu = () => {
    const targetCal = parseInt(targetCalories) || 2000
    const daysCount = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    
    const menu: DayMenu[] = []

    for (let i = 0; i < daysCount; i++) {
      const dayName = period === 'day' ? 'Сегодня' : period === 'week' ? days[i % 7] : `День ${i + 1}`
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

      let breakfast: Meal | undefined
      let lunch: Meal | undefined
      let dinner: Meal | undefined

      // Генерируем блюда в зависимости от выбранного типа
      if (mealType === 'full' || mealType === 'breakfast') {
        const availableBreakfasts = filterMeals(MEALS_DATABASE.breakfast)
        if (availableBreakfasts.length > 0) {
          breakfast = { ...availableBreakfasts[Math.floor(Math.random() * availableBreakfasts.length)] }
        }
      }

      if (mealType === 'full' || mealType === 'lunch') {
        const availableLunches = filterMeals(MEALS_DATABASE.lunch)
        if (availableLunches.length > 0) {
          lunch = { ...availableLunches[Math.floor(Math.random() * availableLunches.length)] }
        }
      }

      if (mealType === 'full' || mealType === 'dinner') {
        const availableDinners = filterMeals(MEALS_DATABASE.dinner)
        if (availableDinners.length > 0) {
          dinner = { ...availableDinners[Math.floor(Math.random() * availableDinners.length)] }
        }
      }

      // Корректируем калории под целевое значение
      const totalCalories = (breakfast?.calories || 0) + (lunch?.calories || 0) + 
                           (dinner?.calories || 0)
      
      if (totalCalories > 0) {
        const ratio = targetCal / totalCalories

        const adjustMeal = (meal: Meal | undefined): Meal | undefined => {
          if (!meal) return undefined
          return {
            ...meal,
            calories: Math.round(meal.calories * ratio),
            fats: Math.round(meal.fats * ratio),
            proteins: Math.round(meal.proteins * ratio),
            carbs: Math.round(meal.carbs * ratio),
          }
        }

        breakfast = adjustMeal(breakfast)
        lunch = adjustMeal(lunch)
        dinner = adjustMeal(dinner)
      }

      menu.push({
        day: dayName,
        date: period !== 'day' ? dateStr : undefined,
        breakfast,
        lunch,
        dinner,
      })
    }

    setGeneratedMenu(menu)
  }

  const toggleProductExclusion = (product: string) => {
    if (excludedProducts.includes(product)) {
      setExcludedProducts(excludedProducts.filter(p => p !== product))
    } else {
      setExcludedProducts([...excludedProducts, product])
    }
  }

  const getTotalForDay = (day: DayMenu) => {
    return {
      calories: (day.breakfast?.calories || 0) + (day.lunch?.calories || 0) + 
               (day.dinner?.calories || 0),
      fats: (day.breakfast?.fats || 0) + (day.lunch?.fats || 0) + 
            (day.dinner?.fats || 0),
      proteins: (day.breakfast?.proteins || 0) + (day.lunch?.proteins || 0) + 
                (day.dinner?.proteins || 0),
      carbs: (day.breakfast?.carbs || 0) + (day.lunch?.carbs || 0) + 
             (day.dinner?.carbs || 0),
    }
  }

  const downloadPDF = async () => {
    if (generatedMenu.length === 0) return

    try {
      setDownloading(true)

      // Создаем canvas для правильного рендеринга кириллицы
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      const dpi = 300
      const mmToPx = dpi / 25.4
      const pageWidthMm = 210
      const pageHeightMm = 297
      const pageWidthPx = pageWidthMm * mmToPx
      const pageHeightPx = pageHeightMm * mmToPx

      canvas.width = pageWidthPx
      canvas.height = pageHeightPx

      // Белый фон
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const marginPx = 20 * mmToPx
      let yPosPx = 25 * mmToPx

      // Заголовок
      ctx.fillStyle = '#10b981' // accent-mint
      ctx.font = 'bold 36px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('Персональное меню', pageWidthPx / 2, yPosPx)
      yPosPx += 50

      // Период и калории
      ctx.fillStyle = '#666666'
      ctx.font = '20px Arial, sans-serif'
      const periodText = period === 'day' ? 'На день' : period === 'week' ? 'На неделю' : 'На месяц'
      ctx.fillText(periodText, pageWidthPx / 2, yPosPx)
      yPosPx += 30
      ctx.fillText(`Целевые калории: ${targetCalories} ккал/день`, pageWidthPx / 2, yPosPx)
      yPosPx += 40

      // Меню для каждого дня
      ctx.textAlign = 'left'
      generatedMenu.forEach((day, dayIndex) => {
        if (yPosPx > pageHeightPx - 100) {
          // Если не хватает места, создаем новую страницу через jsPDF
          return
        }

        const totals = getTotalForDay(day)

        // День
        ctx.fillStyle = '#10b981'
        ctx.font = 'bold 24px Arial, sans-serif'
        const dayText = day.day + (day.date ? ` (${day.date})` : '')
        ctx.fillText(dayText, marginPx, yPosPx)
        yPosPx += 35

        ctx.fillStyle = '#000000'
        ctx.font = '16px Arial, sans-serif'

        if (day.breakfast) {
          ctx.font = 'bold 16px Arial, sans-serif'
          ctx.fillText('Завтрак:', marginPx + 10, yPosPx)
          ctx.font = '16px Arial, sans-serif'
          ctx.fillText(day.breakfast.name, marginPx + 80, yPosPx)
          yPosPx += 25
          ctx.font = '14px Arial, sans-serif'
          ctx.fillStyle = '#666666'
          ctx.fillText(`  ${day.breakfast.calories} ккал | ${day.breakfast.fats}г Ж | ${day.breakfast.proteins}г Б | ${day.breakfast.carbs}г У`, marginPx + 10, yPosPx)
          yPosPx += 30
          ctx.fillStyle = '#000000'
        }

        if (day.lunch) {
          ctx.font = 'bold 16px Arial, sans-serif'
          ctx.fillText('Обед:', marginPx + 10, yPosPx)
          ctx.font = '16px Arial, sans-serif'
          ctx.fillText(day.lunch.name, marginPx + 80, yPosPx)
          yPosPx += 25
          ctx.font = '14px Arial, sans-serif'
          ctx.fillStyle = '#666666'
          ctx.fillText(`  ${day.lunch.calories} ккал | ${day.lunch.fats}г Ж | ${day.lunch.proteins}г Б | ${day.lunch.carbs}г У`, marginPx + 10, yPosPx)
          yPosPx += 30
          ctx.fillStyle = '#000000'
        }

        if (day.dinner) {
          ctx.font = 'bold 16px Arial, sans-serif'
          ctx.fillText('Ужин:', marginPx + 10, yPosPx)
          ctx.font = '16px Arial, sans-serif'
          ctx.fillText(day.dinner.name, marginPx + 80, yPosPx)
          yPosPx += 25
          ctx.font = '14px Arial, sans-serif'
          ctx.fillStyle = '#666666'
          ctx.fillText(`  ${day.dinner.calories} ккал | ${day.dinner.fats}г Ж | ${day.dinner.proteins}г Б | ${day.dinner.carbs}г У`, marginPx + 10, yPosPx)
          yPosPx += 30
          ctx.fillStyle = '#000000'
        }


        // Итого
        ctx.font = 'bold 16px Arial, sans-serif'
        ctx.fillStyle = '#10b981'
        ctx.fillText(`Итого: ${totals.calories} ккал | ${totals.fats}г жиров | ${totals.proteins}г белков | ${totals.carbs}г углеводов`, marginPx, yPosPx)
        yPosPx += 40

        if (dayIndex < generatedMenu.length - 1) {
          ctx.strokeStyle = '#dddddd'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(marginPx, yPosPx)
          ctx.lineTo(pageWidthPx - marginPx, yPosPx)
          ctx.stroke()
          yPosPx += 20
        }
      })

      // Конвертируем canvas в PDF
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = pageWidthMm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      const fileName = `Меню-${period === 'day' ? 'день' : period === 'week' ? 'неделя' : 'месяц'}-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

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
      className="p-6 rounded-2xl bg-gradient-to-br from-accent-mint/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-mint/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
    >
      {/* Параметры */}
      <div className="space-y-6 mb-8">
        {/* Период */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Период
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  period === p
                    ? 'bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        </div>

        {/* Приём пищи */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Приём пищи
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {([
              { value: 'full', label: 'Полное меню' },
              { value: 'breakfast', label: 'Завтрак' },
              { value: 'lunch', label: 'Обед' },
              { value: 'dinner', label: 'Ужин' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMealType(value)}
                className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                  mealType === value
                    ? 'bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Продукты */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Продукты
          </label>
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => {
                setProductFilter('all')
                setExcludedProducts([])
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                productFilter === 'all'
                  ? 'bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setProductFilter('exclude')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                productFilter === 'exclude'
                  ? 'bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Исключить
            </button>
          </div>

          {productFilter === 'exclude' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/60 text-sm mb-3">Выберите продукты для исключения:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_PRODUCTS.map((product) => (
                  <button
                    key={product}
                    onClick={() => toggleProductExclusion(product)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      excludedProducts.includes(product)
                        ? 'bg-accent-mint text-dark-900'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {excludedProducts.includes(product) ? (
                      <X className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3 opacity-0" />
                    )}
                    {product}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Калории */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Калории</label>
          <input
            type="number"
            value={targetCalories}
            onChange={(e) => setTargetCalories(e.target.value)}
            placeholder="2000"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-mint/50 focus:ring-2 focus:ring-accent-mint/20 transition-all"
          />
        </div>
      </div>

      {/* Кнопка генерации */}
      <button
        onClick={generateMenu}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-mint/30 transition-all mb-6 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        Хочу меню
      </button>

      {/* Результат */}
      {generatedMenu.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {generatedMenu.map((day, index) => {
            const totals = getTotalForDay(day)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-accent-mint" />
                  {day.day} {day.date && `(${day.date})`}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {day.breakfast && (
                    <MealCard meal={day.breakfast} label="Завтрак" onImageClick={() => setSelectedMeal(day.breakfast!)} />
                  )}
                  {day.lunch && (
                    <MealCard meal={day.lunch} label="Обед" onImageClick={() => setSelectedMeal(day.lunch!)} />
                  )}
                  {day.dinner && (
                    <MealCard meal={day.dinner} label="Ужин" onImageClick={() => setSelectedMeal(day.dinner!)} />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <span className="text-white/60 font-medium">Всего за день:</span>
                    <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                      <span className="text-white font-semibold whitespace-nowrap">{totals.calories} ккал</span>
                      <span className="text-yellow-400 whitespace-nowrap">{totals.fats}г жиров</span>
                      <span className="text-blue-400 whitespace-nowrap">{totals.proteins}г белков</span>
                      <span className="text-green-400 whitespace-nowrap">{totals.carbs}г углеводов</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-mint/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Скачать меню (PDF)</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Модальное окно с рецептом */}
      <AnimatePresence>
        {selectedMeal && (
          <MealModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MealCard({ meal, label, onImageClick }: { meal: Meal; label: string; onImageClick: () => void }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/60 mb-1">{label}</div>
          <div className="text-white font-medium text-sm break-words leading-tight">{meal.name}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {meal.image && (
            <button
              onClick={onImageClick}
              className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20 hover:border-accent-mint/50 transition-all cursor-pointer flex-shrink-0"
            >
              <Image
                src={meal.image}
                alt={meal.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </button>
          )}
          <div className="flex items-center gap-1 text-white/40 text-xs">
          <span className="whitespace-nowrap">{meal.prepTime}мин</span>
          </div>
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <span className="text-white/60 whitespace-nowrap">{meal.calories} ккал</span>
        <span className="text-yellow-400 whitespace-nowrap">{meal.fats}г Ж</span>
        <span className="text-blue-400 whitespace-nowrap">{meal.proteins}г Б</span>
        <span className="text-green-400 whitespace-nowrap">{meal.carbs}г У</span>
      </div>
    </div>
  )
}

function MealModal({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-dark-800 via-dark-800/95 to-dark-900 border-2 border-white/10 shadow-2xl"
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-red-500/50"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Изображение */}
        {meal.image && (
          <div className="relative w-full h-64 sm:h-80 rounded-t-2xl overflow-hidden">
            <Image
              src={meal.image}
              alt={meal.name}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
          </div>
        )}

        {/* Контент */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-4">{meal.name}</h3>

          {/* Макросы */}
          <div className="flex items-center flex-wrap gap-4 mb-6 p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2">
              <span className="text-white/60">Калории:</span>
              <span className="text-white font-semibold">{meal.calories} ккал</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Жиры:</span>
              <span className="text-yellow-400 font-semibold">{meal.fats}г</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Белки:</span>
              <span className="text-blue-400 font-semibold">{meal.proteins}г</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Углеводы:</span>
              <span className="text-green-400 font-semibold">{meal.carbs}г</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Время:</span>
              <span className="text-white font-semibold">{meal.prepTime} мин</span>
            </div>
          </div>

          {/* Ингредиенты */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-accent-mint" />
                Ингредиенты:
              </h4>
              <ul className="space-y-2">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2 text-white/80">
                    <span className="text-accent-mint mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Инструкции */}
          {meal.instructions && meal.instructions.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-accent-mint" />
                Способ приготовления:
              </h4>
              <ol className="space-y-3">
                {meal.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3 text-white/80">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-mint text-dark-900 font-bold flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

