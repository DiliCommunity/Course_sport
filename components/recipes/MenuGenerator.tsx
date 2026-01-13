'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, UtensilsCrossed, ShoppingCart, Download, Check, X, Sparkles } from 'lucide-react'

interface Meal {
  name: string
  calories: number
  fats: number
  proteins: number
  carbs: number
  prepTime: number
  ingredients?: string[]
}

interface DayMenu {
  day: string
  date?: string
  breakfast?: Meal
  lunch?: Meal
  dinner?: Meal
  snack?: Meal
}

// База данных блюд
const MEALS_DATABASE: Record<string, Meal[]> = {
  breakfast: [
    { name: 'Яичница с беконом и авокадо', calories: 450, fats: 35, proteins: 20, carbs: 5, prepTime: 5 },
    { name: 'Омлет со шпинатом и сыром фета', calories: 380, fats: 28, proteins: 22, carbs: 4, prepTime: 7 },
    { name: 'Яйца Бенедикт на кето-булочке', calories: 520, fats: 38, proteins: 25, carbs: 8, prepTime: 15 },
    { name: 'Скрэмбл с лососем и каперсами', calories: 410, fats: 30, proteins: 24, carbs: 3, prepTime: 8 },
    { name: 'Чиа-пудинг с кокосовым молоком', calories: 280, fats: 22, proteins: 8, carbs: 6, prepTime: 5 },
    { name: 'Кето-гранола с греческим йогуртом', calories: 350, fats: 28, proteins: 15, carbs: 5, prepTime: 5 },
    { name: 'Омлет с авокадо и сыром', calories: 450, fats: 35, proteins: 25, carbs: 4, prepTime: 10 },
    { name: 'Яичница с грибами и сыром', calories: 440, fats: 34, proteins: 26, carbs: 5, prepTime: 15 },
    { name: 'Запеченные яйца в авокадо', calories: 390, fats: 32, proteins: 16, carbs: 8, prepTime: 15 },
    { name: 'Творожные кето-оладьи', calories: 420, fats: 32, proteins: 24, carbs: 6, prepTime: 15 },
  ],
  lunch: [
    { name: 'Салат с тунцом и оливковым маслом', calories: 380, fats: 28, proteins: 25, carbs: 4, prepTime: 10 },
    { name: 'Кето-бургер с сыром и авокадо', calories: 550, fats: 42, proteins: 30, carbs: 6, prepTime: 15 },
    { name: 'Куриная грудка с овощами гриль', calories: 420, fats: 22, proteins: 38, carbs: 5, prepTime: 20 },
    { name: 'Лосось с зеленым салатом', calories: 480, fats: 32, proteins: 35, carbs: 3, prepTime: 15 },
    { name: 'Овощной салат с орехами и сыром', calories: 350, fats: 28, proteins: 15, carbs: 7, prepTime: 12 },
    { name: 'Кето-бургер с говядиной', calories: 520, fats: 38, proteins: 35, carbs: 5, prepTime: 20 },
    { name: 'Куриная грудка с брокколи', calories: 450, fats: 32, proteins: 30, carbs: 6, prepTime: 25 },
    { name: 'Лосось с овощами на пару', calories: 420, fats: 26, proteins: 38, carbs: 7, prepTime: 20 },
  ],
  dinner: [
    { name: 'Стейк из лосося с зеленым салатом', calories: 520, fats: 38, proteins: 40, carbs: 4, prepTime: 15 },
    { name: 'Куриные котлетки с сыром', calories: 450, fats: 32, proteins: 32, carbs: 5, prepTime: 15 },
    { name: 'Говядина с овощами', calories: 580, fats: 42, proteins: 38, carbs: 6, prepTime: 25 },
    { name: 'Индейка с брокколи', calories: 420, fats: 24, proteins: 35, carbs: 4, prepTime: 20 },
    { name: 'Кето-пицца на миндальной муке', calories: 480, fats: 36, proteins: 22, carbs: 8, prepTime: 30 },
    { name: 'Стейк из говядины с салатом', calories: 580, fats: 42, proteins: 45, carbs: 6, prepTime: 25 },
    { name: 'Запеченная курица с овощами', calories: 520, fats: 35, proteins: 40, carbs: 8, prepTime: 45 },
    { name: 'Кето-лазанья с цукини', calories: 480, fats: 32, proteins: 35, carbs: 10, prepTime: 50 },
    { name: 'Жареные креветки с чесноком', calories: 350, fats: 22, proteins: 32, carbs: 4, prepTime: 15 },
  ],
  snack: [
    { name: 'Орехи макадамия 30г', calories: 200, fats: 21, proteins: 2, carbs: 2, prepTime: 0 },
    { name: 'Авокадо с солью', calories: 160, fats: 15, proteins: 2, carbs: 2, prepTime: 2 },
    { name: 'Сыр чеддер 50г', calories: 180, fats: 14, proteins: 12, carbs: 1, prepTime: 0 },
    { name: 'Кето-печенье (2 шт)', calories: 150, fats: 12, proteins: 5, carbs: 3, prepTime: 0 },
    { name: 'Орехи миндаль 30г', calories: 170, fats: 15, proteins: 6, carbs: 3, prepTime: 0 },
    { name: 'Греческий йогурт с орехами', calories: 140, fats: 10, proteins: 8, carbs: 4, prepTime: 2 },
  ],
}

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
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'full'>('full')
  const [productFilter, setProductFilter] = useState<'all' | 'exclude'>('all')
  const [excludedProducts, setExcludedProducts] = useState<string[]>([])
  const [targetCalories, setTargetCalories] = useState('2000')
  const [generatedMenu, setGeneratedMenu] = useState<DayMenu[]>([])
  const [downloading, setDownloading] = useState(false)

  // Фильтрация блюд по исключенным продуктам
  const filterMeals = (meals: Meal[]): Meal[] => {
    if (productFilter === 'all' || excludedProducts.length === 0) {
      return meals
    }

    return meals.filter(meal => {
      const mealNameLower = meal.name.toLowerCase()
      return !excludedProducts.some(excluded => 
        mealNameLower.includes(excluded.toLowerCase())
      )
    })
  }

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
      let snack: Meal | undefined

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

      if (mealType === 'full' || mealType === 'snack') {
        const availableSnacks = filterMeals(MEALS_DATABASE.snack)
        if (availableSnacks.length > 0 && Math.random() > 0.3) {
          snack = { ...availableSnacks[Math.floor(Math.random() * availableSnacks.length)] }
        }
      }

      // Корректируем калории под целевое значение
      const totalCalories = (breakfast?.calories || 0) + (lunch?.calories || 0) + 
                           (dinner?.calories || 0) + (snack?.calories || 0)
      
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
        snack = adjustMeal(snack)
      }

      menu.push({
        day: dayName,
        date: period !== 'day' ? dateStr : undefined,
        breakfast,
        lunch,
        dinner,
        snack,
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
               (day.dinner?.calories || 0) + (day.snack?.calories || 0),
      fats: (day.breakfast?.fats || 0) + (day.lunch?.fats || 0) + 
            (day.dinner?.fats || 0) + (day.snack?.fats || 0),
      proteins: (day.breakfast?.proteins || 0) + (day.lunch?.proteins || 0) + 
                (day.dinner?.proteins || 0) + (day.snack?.proteins || 0),
      carbs: (day.breakfast?.carbs || 0) + (day.lunch?.carbs || 0) + 
             (day.dinner?.carbs || 0) + (day.snack?.carbs || 0),
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

        if (day.snack) {
          ctx.font = 'bold 16px Arial, sans-serif'
          ctx.fillText('Перекус:', marginPx + 10, yPosPx)
          ctx.font = '16px Arial, sans-serif'
          ctx.fillText(day.snack.name, marginPx + 80, yPosPx)
          yPosPx += 25
          ctx.font = '14px Arial, sans-serif'
          ctx.fillStyle = '#666666'
          ctx.fillText(`  ${day.snack.calories} ккал | ${day.snack.fats}г Ж | ${day.snack.proteins}г Б | ${day.snack.carbs}г У`, marginPx + 10, yPosPx)
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
              { value: 'snack', label: 'Полдник' },
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
                    <MealCard meal={day.breakfast} label="Завтрак" />
                  )}
                  {day.lunch && (
                    <MealCard meal={day.lunch} label="Обед" />
                  )}
                  {day.dinner && (
                    <MealCard meal={day.dinner} label="Ужин" />
                  )}
                  {day.snack && (
                    <MealCard meal={day.snack} label="Перекус" />
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
    </motion.div>
  )
}

function MealCard({ meal, label }: { meal: Meal; label: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/60 mb-1">{label}</div>
          <div className="text-white font-medium text-sm break-words leading-tight">{meal.name}</div>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs flex-shrink-0">
          <span className="whitespace-nowrap">{meal.prepTime}мин</span>
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

