'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UtensilsCrossed, ChefHat, RefreshCw, Download, CheckCircle2, Clock, Flame } from 'lucide-react'
import Image from 'next/image'

interface Meal {
  name: string
  description: string
  image: string
  ingredients: { name: string; quantity: string; checked: boolean }[]
  instructions: string[]
  calories: number
  fats: number
  proteins: number
  carbs: number
  prepTime: number
  difficulty: 'Простой' | 'Средний' | 'Сложный'
}

const LUNCH_MEALS: Meal[] = [
  {
    name: 'Салат с тунцом и авокадо',
    description: 'Свежий и сытный салат с консервированным тунцом, авокадо и зеленью',
    image: '/img/recipes/avocado-tuna.jpg',
    ingredients: [
      { name: 'Тунец консервированный', quantity: '1 банка (200г)', checked: false },
      { name: 'Авокадо', quantity: '1 шт', checked: false },
      { name: 'Салат листовой', quantity: '100г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Промойте и обсушите салатные листья',
      'Нарежьте авокадо кубиками',
      'Смешайте тунец с оливковым маслом и лимонным соком',
      'Выложите салат на тарелку, добавьте авокадо и тунца',
      'Посолите и поперчите по вкусу',
    ],
    calories: 380,
    fats: 28,
    proteins: 25,
    carbs: 8,
    prepTime: 15,
    difficulty: 'Простой'
  },
  {
    name: 'Кето-бургер с говядиной',
    description: 'Сочный бургер без булки с говяжьей котлетой и овощами',
    image: '/img/recipes/keto-burger.jpg',
    ingredients: [
      { name: 'Говяжий фарш', quantity: '200г', checked: false },
      { name: 'Сыр чеддер', quantity: '50г', checked: false },
      { name: 'Бекон', quantity: '2 полоски', checked: false },
      { name: 'Помидоры черри', quantity: '3-4 шт', checked: false },
      { name: 'Салат листовой', quantity: '2 листа', checked: false },
      { name: 'Майонез', quantity: '1 ст.л.', checked: false },
    ],
    instructions: [
      'Сформируйте котлету из фарша, посолите и поперчите',
      'Обжарьте котлету на сковороде 4-5 минут с каждой стороны',
      'Обжарьте бекон до хрустящей корочки',
      'Соберите бургер: котлета, сыр, бекон, помидоры, салат, майонез',
    ],
    calories: 520,
    fats: 38,
    proteins: 35,
    carbs: 5,
    prepTime: 20,
    difficulty: 'Средний'
  },
  {
    name: 'Куриная грудка с брокколи',
    description: 'Нежное филе курицы с обжаренной брокколи в сливочном соусе',
    image: '/img/recipes/chicken-mushrooms-cream.jpg',
    ingredients: [
      { name: 'Куриная грудка', quantity: '200г', checked: false },
      { name: 'Брокколи', quantity: '200г', checked: false },
      { name: 'Сливочное масло', quantity: '30г', checked: false },
      { name: 'Чеснок', quantity: '2 зубчика', checked: false },
      { name: 'Сливки 33%', quantity: '50мл', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Нарежьте куриную грудку на кусочки',
      'Обжарьте курицу на масле до золотистой корочки',
      'Добавьте брокколи и чеснок, обжаривайте 5 минут',
      'Влейте сливки, тушите 3-4 минуты',
      'Посолите и поперчите по вкусу',
    ],
    calories: 450,
    fats: 32,
    proteins: 30,
    carbs: 6,
    prepTime: 25,
    difficulty: 'Средний'
  },
  {
    name: 'Лосось с овощами на пару',
    description: 'Нежный лосось с цветной капустой и спаржей',
    image: '/img/recipes/grilled-salmon-vegetables.jpg',
    ingredients: [
      { name: 'Филе лосося', quantity: '200г', checked: false },
      { name: 'Цветная капуста', quantity: '150г', checked: false },
      { name: 'Спаржа', quantity: '100г', checked: false },
      { name: 'Лимон', quantity: '1/2 шт', checked: false },
      { name: 'Оливковое масло', quantity: '1 ст.л.', checked: false },
      { name: 'Укроп', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Приготовьте лосось на пару 8-10 минут',
      'Отварите цветную капусту и спаржу на пару 5-7 минут',
      'Полите лосось оливковым маслом и лимонным соком',
      'Подавайте с овощами, украсьте укропом',
    ],
    calories: 420,
    fats: 26,
    proteins: 38,
    carbs: 7,
    prepTime: 20,
    difficulty: 'Простой'
  },
]

const DINNER_MEALS: Meal[] = [
  {
    name: 'Стейк из говядины с салатом',
    description: 'Сочный стейк средней прожарки с свежим салатом',
    image: '/img/recipes/beef-steak-green-salad.jpg',
    ingredients: [
      { name: 'Говядина (стейк)', quantity: '250г', checked: false },
      { name: 'Салат листовой', quantity: '100г', checked: false },
      { name: 'Помидоры черри', quantity: '5-6 шт', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Бальзамический уксус', quantity: '1 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Разогрейте сковороду на сильном огне',
      'Обжарьте стейк по 3-4 минуты с каждой стороны',
      'Дайте стейку отдохнуть 5 минут',
      'Приготовьте салат: смешайте листья, помидоры, масло и уксус',
      'Подавайте стейк с салатом',
    ],
    calories: 580,
    fats: 42,
    proteins: 45,
    carbs: 6,
    prepTime: 25,
    difficulty: 'Средний'
  },
  {
    name: 'Запеченная курица с овощами',
    description: 'Целая куриная ножка с запеченными овощами',
    image: '/img/recipes/baked-chicken-vegetables.jpg',
    ingredients: [
      { name: 'Куриная ножка', quantity: '1 шт (250г)', checked: false },
      { name: 'Брокколи', quantity: '150г', checked: false },
      { name: 'Цветная капуста', quantity: '150г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Чеснок', quantity: '3 зубчика', checked: false },
      { name: 'Розмарин', quantity: '2 веточки', checked: false },
    ],
    instructions: [
      'Разогрейте духовку до 200°C',
      'Обмажьте курицу маслом, посолите, поперчите',
      'Выложите курицу и овощи на противень',
      'Запекайте 35-40 минут до золотистой корочки',
      'Подавайте горячим',
    ],
    calories: 520,
    fats: 35,
    proteins: 40,
    carbs: 8,
    prepTime: 45,
    difficulty: 'Простой'
  },
  {
    name: 'Кето-лазанья с цукини',
    description: 'Классическая лазанья без пасты, с листами цукини',
    image: '/img/recipes/keto-zucchini-lasagna.jpg',
    ingredients: [
      { name: 'Цукини', quantity: '2 шт', checked: false },
      { name: 'Говяжий фарш', quantity: '300г', checked: false },
      { name: 'Сыр моцарелла', quantity: '150г', checked: false },
      { name: 'Сыр пармезан', quantity: '50г', checked: false },
      { name: 'Томатная паста', quantity: '2 ст.л.', checked: false },
      { name: 'Чеснок', quantity: '2 зубчика', checked: false },
    ],
    instructions: [
      'Нарежьте цукини тонкими пластинами',
      'Обжарьте фарш с чесноком, добавьте томатную пасту',
      'Соберите лазанью слоями: цукини, фарш, сыр',
      'Запекайте в духовке 30 минут при 180°C',
      'Посыпьте пармезаном перед подачей',
    ],
    calories: 480,
    fats: 32,
    proteins: 35,
    carbs: 10,
    prepTime: 50,
    difficulty: 'Сложный'
  },
  {
    name: 'Жареные креветки с чесноком',
    description: 'Крупные креветки в чесночном масле с зеленью',
    image: '/img/recipes/shrimp-garlic-butter.jpg',
    ingredients: [
      { name: 'Креветки крупные', quantity: '300г', checked: false },
      { name: 'Чеснок', quantity: '4 зубчика', checked: false },
      { name: 'Сливочное масло', quantity: '40г', checked: false },
      { name: 'Петрушка', quantity: '2 ст.л.', checked: false },
      { name: 'Лимон', quantity: '1/2 шт', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Очистите креветки от панциря',
      'Растопите масло, обжарьте чеснок 1 минуту',
      'Добавьте креветки, жарьте 3-4 минуты',
      'Добавьте петрушку и лимонный сок',
      'Подавайте сразу горячими',
    ],
    calories: 350,
    fats: 22,
    proteins: 32,
    carbs: 4,
    prepTime: 15,
    difficulty: 'Простой'
  },
]

export function MealGenerator() {
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch')
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null)
  const [downloading, setDownloading] = useState(false)

  const generateMeal = () => {
    const meals = mealType === 'lunch' ? LUNCH_MEALS : DINNER_MEALS
    const randomMeal = meals[Math.floor(Math.random() * meals.length)]
    // Сбрасываем checked для всех ингредиентов
    const mealWithResetIngredients = {
      ...randomMeal,
      ingredients: randomMeal.ingredients.map(ing => ({ ...ing, checked: false }))
    }
    setCurrentMeal(mealWithResetIngredients)
  }

  const toggleIngredient = (index: number) => {
    if (!currentMeal) return
    const updatedIngredients = [...currentMeal.ingredients]
    updatedIngredients[index].checked = !updatedIngredients[index].checked
    setCurrentMeal({
      ...currentMeal,
      ingredients: updatedIngredients
    })
  }

  const downloadPDF = async () => {
    if (!currentMeal) return

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
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 36px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(currentMeal.name, pageWidthPx / 2, yPosPx)
      yPosPx += 50

      // Тип блюда
      ctx.fillStyle = '#666666'
      ctx.font = '20px Arial, sans-serif'
      const mealTypeText = mealType === 'lunch' ? 'Обед' : 'Ужин'
      ctx.fillText(mealTypeText, pageWidthPx / 2, yPosPx)
      yPosPx += 35

      // Описание
      ctx.fillStyle = '#333333'
      ctx.font = '18px Arial, sans-serif'
      ctx.textAlign = 'left'
      const descriptionLines = currentMeal.description.match(/.{1,55}/g) || [currentMeal.description]
      descriptionLines.forEach((line: string) => {
        ctx.fillText(line, marginPx, yPosPx)
        yPosPx += 25
      })
      yPosPx += 20

      // Макросы
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.fillText('Пищевая ценность:', marginPx, yPosPx)
      yPosPx += 30

      ctx.fillStyle = '#000000'
      ctx.font = '18px Arial, sans-serif'
      ctx.fillText(`Калории: ${currentMeal.calories} ккал`, marginPx + 10, yPosPx)
      yPosPx += 25
      ctx.fillText(`Жиры: ${currentMeal.fats}г | Белки: ${currentMeal.proteins}г | Углеводы: ${currentMeal.carbs}г`, marginPx + 10, yPosPx)
      yPosPx += 25
      ctx.fillText(`Время приготовления: ${currentMeal.prepTime} мин | Сложность: ${currentMeal.difficulty}`, marginPx + 10, yPosPx)
      yPosPx += 35

      // Ингредиенты - только выбранные
      const selectedIngredients = currentMeal.ingredients.filter(ing => ing.checked)
      if (selectedIngredients.length > 0) {
        ctx.fillStyle = '#3b82f6'
        ctx.font = 'bold 22px Arial, sans-serif'
        ctx.fillText('Ингредиенты:', marginPx, yPosPx)
        yPosPx += 30

        ctx.fillStyle = '#000000'
        ctx.font = '18px Arial, sans-serif'
        selectedIngredients.forEach((ing, index) => {
          if (yPosPx > pageHeightPx - 100) {
            return
          }
          const itemText = `✓ ${ing.name} - ${ing.quantity}`
          ctx.fillText(itemText, marginPx + 10, yPosPx)
          yPosPx += 28
        })
        yPosPx += 20
      }

      // Инструкции
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.fillText('Инструкция по приготовлению:', marginPx, yPosPx)
      yPosPx += 25

      ctx.fillStyle = '#000000'
      ctx.font = '18px Arial, sans-serif'
      currentMeal.instructions.forEach((step, index) => {
        if (yPosPx > pageHeightPx - 50) {
          return
        }
        ctx.fillText(`${index + 1}. ${step}`, marginPx + 10, yPosPx)
        yPosPx += 30
      })

      // Конвертируем canvas в PDF
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm)

      const fileName = `Кето-${mealType === 'lunch' ? 'обед' : 'ужин'}-${currentMeal.name.replace(/\s+/g, '-')}-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
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
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-electric/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-electric/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-teal flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Генератор блюд</h3>
          <p className="text-white/60 text-sm">От простых до ресторанных рецептов</p>
        </div>
      </div>

      {/* Выбор типа блюда */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => {
              setMealType('lunch')
              setCurrentMeal(null)
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              mealType === 'lunch'
                ? 'bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            Обед
          </button>
          <button
            onClick={() => {
              setMealType('dinner')
              setCurrentMeal(null)
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              mealType === 'dinner'
                ? 'bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            Ужин
          </button>
        </div>

        <button
          onClick={generateMeal}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Сгенерировать {mealType === 'lunch' ? 'обед' : 'ужин'}
        </button>
      </div>

      {/* Отображение блюда */}
      {currentMeal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Изображение */}
          <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden">
            <Image
              src={currentMeal.image}
              alt={currentMeal.name}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            {currentMeal.image.includes('recipes/') && (
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
            )}
          </div>

          {/* Информация о блюде */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-xl font-bold text-white mb-2">{currentMeal.name}</h4>
            <p className="text-white/70 text-sm mb-4">{currentMeal.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Flame className="w-4 h-4 text-accent-flame" />
                <span>{currentMeal.calories} ккал</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-yellow-400">Ж:</span>
                <span>{currentMeal.fats}г</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-blue-400">Б:</span>
                <span>{currentMeal.proteins}г</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="w-4 h-4" />
                <span>{currentMeal.prepTime} мин</span>
              </div>
            </div>
          </div>

          {/* Ингредиенты */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h5 className="text-lg font-semibold text-white mb-3">Ингредиенты:</h5>
            <div className="space-y-2">
              {currentMeal.ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => toggleIngredient(index)}
                >
                  <div className="flex-shrink-0">
                    {ing.checked ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${ing.checked ? 'line-through text-white/40' : 'text-white'}`}>
                      {ing.name}
                    </div>
                    <div className="text-xs text-white/60">{ing.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Инструкция */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h5 className="text-lg font-semibold text-white mb-3">Инструкция:</h5>
            <ol className="space-y-2 list-decimal list-inside text-white/80 text-sm">
              {currentMeal.instructions.map((step, index) => (
                <li key={index} className="ml-2">{step}</li>
              ))}
            </ol>
          </div>

          {/* Кнопка скачать PDF */}
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-electric/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Скачать рецепт и список продуктов (PDF)</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

