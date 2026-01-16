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

      const mealTypeText = mealType === 'lunch' ? 'Обед' : 'Ужин'
      const selectedIngredients = currentMeal.ingredients.filter(ing => ing.checked)

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

      const ingredientsHtml = selectedIngredients.length > 0 ? `
        <div style="margin-bottom: 35px;">
          <h2 style="
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            <span style="font-size: 28px;">🍽️</span>
            Ингредиенты:
          </h2>
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
          ">
            <ul style="margin: 0; padding-left: 25px; list-style: none; line-height: 2.2;">
              ${selectedIngredients.map(ing => `
                <li style="
                  color: rgba(255, 255, 255, 0.9);
                  font-size: 16px;
                  margin-bottom: 8px;
                  padding-left: 25px;
                  position: relative;
                ">
                  <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                  ${ing.name} - ${ing.quantity}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      ` : ''

      const instructionsHtml = currentMeal.instructions.map((step, idx) => `
        <li style="
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          margin-bottom: 15px;
          padding-left: 50px;
          position: relative;
          line-height: 1.6;
        ">
          <span style="
            position: absolute;
            left: 0;
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
          ">${idx + 1}</span>
          ${step}
        </li>
      `).join('')

      printContent.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
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
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
          ">
            ${currentMeal.name}
          </h1>
          <p style="text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 16px; margin: 0 0 40px 0; text-transform: uppercase; letter-spacing: 2px;">
            ${mealTypeText}
          </p>
          
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
          ">
            <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0;">
              ${currentMeal.description}
            </p>
          </div>
          
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 35px;
            backdrop-filter: blur(10px);
          ">
            <h2 style="
              font-size: 20px;
              color: #3b82f6;
              margin: 0 0 15px 0;
              font-weight: bold;
            ">📊 Пищевая ценность:</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: rgba(255, 107, 53, 0.15); border: 1px solid rgba(255, 107, 53, 0.3); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">🔥 Калории</div>
                <div style="font-size: 20px; font-weight: bold; color: #ff6b35;">${currentMeal.calories} ккал</div>
              </div>
              <div style="background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 15px; text-align: center;">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">⏱ Время</div>
                <div style="font-size: 20px; font-weight: bold; color: #00d4ff;">${currentMeal.prepTime} мин</div>
              </div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 15px; margin-top: 15px; text-align: center;">
              <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 8px;">📊 БЖУ</div>
              <div style="font-size: 18px; font-weight: bold; color: #10b981;">
                ${currentMeal.fats}г Ж / ${currentMeal.proteins}г Б / ${currentMeal.carbs}г У
              </div>
            </div>
            <div style="margin-top: 15px; text-align: center; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
              Сложность: ${currentMeal.difficulty}
            </div>
          </div>
          
          ${ingredientsHtml}
          
          <div>
            <h2 style="
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
              margin: 0 0 20px 0;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              <span style="font-size: 28px;">👨‍🍳</span>
              Инструкция по приготовлению:
            </h2>
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 20px;
              backdrop-filter: blur(10px);
            ">
              <ol style="margin: 0; padding-left: 0; list-style: none; counter-reset: step-counter;">
                ${instructionsHtml}
              </ol>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(printContent)

      // Используем html2canvas для создания изображения
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0a0b',
        allowTaint: true
      })

      document.body.removeChild(printContent)

      // Конвертируем canvas в PDF
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

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

