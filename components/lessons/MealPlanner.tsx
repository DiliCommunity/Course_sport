'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, UtensilsCrossed, Clock, ShoppingCart, Copy, Check, Download } from 'lucide-react'

interface Meal {
  name: string
  calories: number
  fats: number
  proteins: number
  carbs: number
  prepTime: number
}

interface DayPlan {
  day: string
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  snack?: Meal
}

const KETO_MEALS: Record<string, Meal[]> = {
  breakfast: [
    { name: 'Яичница с беконом и авокадо', calories: 450, fats: 35, proteins: 20, carbs: 5, prepTime: 5 },
    { name: 'Омлет со шпинатом и сыром фета', calories: 380, fats: 28, proteins: 22, carbs: 4, prepTime: 7 },
    { name: 'Яйца Бенедикт на кето-булочке', calories: 520, fats: 38, proteins: 25, carbs: 8, prepTime: 15 },
    { name: 'Скрэмбл с лососем и каперсами', calories: 410, fats: 30, proteins: 24, carbs: 3, prepTime: 8 },
    { name: 'Чиа-пудинг с кокосовым молоком', calories: 280, fats: 22, proteins: 8, carbs: 6, prepTime: 5 },
    { name: 'Кето-гранола с греческим йогуртом', calories: 350, fats: 28, proteins: 15, carbs: 5, prepTime: 5 },
  ],
  lunch: [
    { name: 'Салат с тунцом и оливковым маслом', calories: 380, fats: 28, proteins: 25, carbs: 4, prepTime: 10 },
    { name: 'Кето-бургер с сыром и авокадо', calories: 550, fats: 42, proteins: 30, carbs: 6, prepTime: 15 },
    { name: 'Куриная грудка с овощами гриль', calories: 420, fats: 22, proteins: 38, carbs: 5, prepTime: 20 },
    { name: 'Лосось с зеленым салатом', calories: 480, fats: 32, proteins: 35, carbs: 3, prepTime: 15 },
    { name: 'Овощной салат с орехами и сыром', calories: 350, fats: 28, proteins: 15, carbs: 7, prepTime: 12 },
  ],
  dinner: [
    { name: 'Стейк из лосося с зеленым салатом', calories: 520, fats: 38, proteins: 40, carbs: 4, prepTime: 15 },
    { name: 'Куриные котлетки с сыром', calories: 450, fats: 32, proteins: 32, carbs: 5, prepTime: 15 },
    { name: 'Говядина с овощами', calories: 580, fats: 42, proteins: 38, carbs: 6, prepTime: 25 },
    { name: 'Индейка с брокколи', calories: 420, fats: 24, proteins: 35, carbs: 4, prepTime: 20 },
    { name: 'Кето-пицца на миндальной муке', calories: 480, fats: 36, proteins: 22, carbs: 8, prepTime: 30 },
  ],
  snack: [
    { name: 'Орехи макадамия 30г', calories: 200, fats: 21, proteins: 2, carbs: 2, prepTime: 0 },
    { name: 'Авокадо с солью', calories: 160, fats: 15, proteins: 2, carbs: 2, prepTime: 2 },
    { name: 'Сыр чеддер 50г', calories: 180, fats: 14, proteins: 12, carbs: 1, prepTime: 0 },
    { name: 'Кето-печенье (2 шт)', calories: 150, fats: 12, proteins: 5, carbs: 3, prepTime: 0 },
  ]
}

export function MealPlanner() {
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([])
  const [targetCalories, setTargetCalories] = useState('2000')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const generateWeekPlan = () => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    const targetCal = parseInt(targetCalories) || 2000
    
    const newPlan: DayPlan[] = days.map((day, index) => {
      // Выбираем случайные блюда для разнообразия
      const breakfast = KETO_MEALS.breakfast[Math.floor(Math.random() * KETO_MEALS.breakfast.length)]
      const lunch = KETO_MEALS.lunch[Math.floor(Math.random() * KETO_MEALS.lunch.length)]
      const dinner = KETO_MEALS.dinner[Math.floor(Math.random() * KETO_MEALS.dinner.length)]
      const snack = Math.random() > 0.3 ? KETO_MEALS.snack[Math.floor(Math.random() * KETO_MEALS.snack.length)] : undefined
      
      // Корректируем калории под целевое значение
      const totalCalories = breakfast.calories + lunch.calories + dinner.calories + (snack?.calories || 0)
      const ratio = targetCal / totalCalories
      
      const adjustMeal = (meal: Meal) => ({
        ...meal,
        calories: Math.round(meal.calories * ratio),
        fats: Math.round(meal.fats * ratio),
        proteins: Math.round(meal.proteins * ratio),
        carbs: Math.round(meal.carbs * ratio),
      })
      
      return {
        day,
        breakfast: adjustMeal(breakfast),
        lunch: adjustMeal(lunch),
        dinner: adjustMeal(dinner),
        snack: snack ? adjustMeal(snack) : undefined
      }
    })
    
    setWeekPlan(newPlan)
  }

  const getTotalForDay = (day: DayPlan) => {
    return {
      calories: day.breakfast.calories + day.lunch.calories + day.dinner.calories + (day.snack?.calories || 0),
      fats: day.breakfast.fats + day.lunch.fats + day.dinner.fats + (day.snack?.fats || 0),
      proteins: day.breakfast.proteins + day.lunch.proteins + day.dinner.proteins + (day.snack?.proteins || 0),
      carbs: day.breakfast.carbs + day.lunch.carbs + day.dinner.carbs + (day.snack?.carbs || 0),
    }
  }

  const copyShoppingList = () => {
    const ingredients = new Set<string>()
    weekPlan.forEach(day => {
      ingredients.add(day.breakfast.name)
      ingredients.add(day.lunch.name)
      ingredients.add(day.dinner.name)
      if (day.snack) ingredients.add(day.snack.name)
    })
    
    const list = Array.from(ingredients).join('\n')
    navigator.clipboard.writeText(list)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    if (weekPlan.length === 0) return
    
    try {
      setDownloading(true)
      
      // Динамический импорт jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      // Заголовок
      doc.setFontSize(20)
      doc.setTextColor(16, 185, 129) // accent-mint цвет
      doc.text('План питания на неделю (Кето)', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Целевые калории: ${targetCalories} ккал/день`, 105, 28, { align: 'center' })
      
      let yPos = 40
      const pageHeight = 280
      const margin = 15
      const lineHeight = 8
      
      weekPlan.forEach((day, dayIndex) => {
        // Проверяем, нужна ли новая страница
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = 20
        }
        
        const totals = getTotalForDay(day)
        
        // Название дня
        doc.setFontSize(16)
        doc.setTextColor(16, 185, 129)
        doc.text(day.day, margin, yPos)
        yPos += 10
        
        // Завтрак
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`Завтрак: ${day.breakfast.name}`, margin + 5, yPos)
        yPos += 6
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${day.breakfast.calories} ккал | ${day.breakfast.fats}г Ж | ${day.breakfast.proteins}г Б | ${day.breakfast.carbs}г У | ${day.breakfast.prepTime} мин`, margin + 10, yPos)
        yPos += 7
        
        // Обед
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`Обед: ${day.lunch.name}`, margin + 5, yPos)
        yPos += 6
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${day.lunch.calories} ккал | ${day.lunch.fats}г Ж | ${day.lunch.proteins}г Б | ${day.lunch.carbs}г У | ${day.lunch.prepTime} мин`, margin + 10, yPos)
        yPos += 7
        
        // Ужин
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`Ужин: ${day.dinner.name}`, margin + 5, yPos)
        yPos += 6
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${day.dinner.calories} ккал | ${day.dinner.fats}г Ж | ${day.dinner.proteins}г Б | ${day.dinner.carbs}г У | ${day.dinner.prepTime} мин`, margin + 10, yPos)
        yPos += 7
        
        // Перекус (если есть)
        if (day.snack) {
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          doc.text(`Перекус: ${day.snack.name}`, margin + 5, yPos)
          yPos += 6
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(`${day.snack.calories} ккал | ${day.snack.fats}г Ж | ${day.snack.proteins}г Б | ${day.snack.carbs}г У | ${day.snack.prepTime} мин`, margin + 10, yPos)
          yPos += 7
        }
        
        // Итого за день
        doc.setFontSize(10)
        doc.setTextColor(16, 185, 129)
        doc.setFont(undefined, 'bold')
        doc.text(`Итого: ${totals.calories} ккал | ${totals.fats}г жиров | ${totals.proteins}г белков | ${totals.carbs}г углеводов`, margin + 5, yPos)
        yPos += 10
        
        // Разделитель между днями
        if (dayIndex < weekPlan.length - 1) {
          doc.setDrawColor(200, 200, 200)
          doc.line(margin, yPos, 195, yPos)
          yPos += 5
        }
      })
      
      // Сохраняем PDF
      const fileName = `Кето-план-питания-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      doc.save(fileName)
      
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
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-mint/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-mint/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-mint to-accent-teal flex items-center justify-center">
          <Calendar className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Планировщик питания на неделю</h3>
          <p className="text-white/60 text-sm">Генерация персонального плана питания на 7 дней</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-white/80 text-sm font-medium mb-2">Целевые калории в день</label>
        <input
          type="number"
          value={targetCalories}
          onChange={(e) => setTargetCalories(e.target.value)}
          placeholder="2000"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-mint/50 focus:ring-2 focus:ring-accent-mint/20 transition-all"
        />
      </div>

      <button
        onClick={generateWeekPlan}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-mint/30 transition-all mb-6"
      >
        Сгенерировать план на неделю
      </button>

      {weekPlan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {weekPlan.map((day, index) => {
            const totals = getTotalForDay(day)
            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-accent-mint" />
                  {day.day}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <MealCard meal={day.breakfast} label="Завтрак" />
                  <MealCard meal={day.lunch} label="Обед" />
                  <MealCard meal={day.dinner} label="Ужин" />
                  {day.snack && <MealCard meal={day.snack} label="Перекус" />}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Всего за день:</span>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-medium">{totals.calories} ккал</span>
                      <span className="text-yellow-400">{totals.fats}г жиров</span>
                      <span className="text-blue-400">{totals.proteins}г белков</span>
                      <span className="text-green-400">{totals.carbs}г углеводов</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={copyShoppingList}
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-accent-mint" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Скопировать список</span>
                </>
              )}
            </button>
            
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="py-3 rounded-xl bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-mint/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  <span>Генерация PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
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

function MealCard({ meal, label }: { meal: Meal; label: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-xs text-white/60 mb-1">{label}</div>
          <div className="text-white font-medium text-sm">{meal.name}</div>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Clock className="w-3 h-3" />
          {meal.prepTime}мин
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-white/60">{meal.calories} ккал</span>
        <span className="text-yellow-400">{meal.fats}г Ж</span>
        <span className="text-blue-400">{meal.proteins}г Б</span>
        <span className="text-green-400">{meal.carbs}г У</span>
      </div>
    </div>
  )
}

