'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, Clock, Flame, X, ChefHat, FileText, Minus, Plus, Users } from 'lucide-react'

// PDF гайды по кето продуктам
const ketoGuides = [
  {
    id: 'green',
    title: 'Зелёный список',
    description: 'Продукты, которые можно есть без ограничений на кето',
    icon: '🥬',
    colorClass: 'text-accent-neon',
    bgClass: 'bg-accent-neon/10',
    borderClass: 'border-accent-neon/30',
    pdfUrl: '/files/keto_products_guide.pdf',
  },
  {
    id: 'yellow',
    title: 'Жёлтый список',
    description: 'Продукты с умеренным содержанием углеводов - употребляйте осторожно',
    icon: '🧀',
    colorClass: 'text-accent-gold',
    bgClass: 'bg-accent-gold/10',
    borderClass: 'border-accent-gold/30',
    pdfUrl: '/files/keto_products_guide.pdf',
  },
  {
    id: 'red',
    title: 'Красный список',
    description: 'Продукты, которых следует избегать на кето диете',
    icon: '🚫',
    colorClass: 'text-accent-flame',
    bgClass: 'bg-accent-flame/10',
    borderClass: 'border-accent-flame/30',
    pdfUrl: '/files/keto_products_guide.pdf',
  },
  {
    id: 'full',
    title: 'Полный гайд по кето продуктам',
    description: 'Всё в одном файле: что можно, что нельзя, и почему',
    icon: '📚',
    colorClass: 'text-accent-electric',
    bgClass: 'bg-accent-electric/10',
    borderClass: 'border-accent-electric/30',
    pdfUrl: '/files/keto_products_guide.pdf',
  },
]

// Категории рецептов
const categories = [
  { id: 'breakfast', name: 'Завтрак', icon: '🌅', desc: 'Начните день с правильного кето-завтрака' },
  { id: 'lunch', name: 'Обед', icon: '🍽️', desc: 'Сытные и полезные кето-обеды' },
  { id: 'dinner', name: 'Ужин', icon: '🌙', desc: 'Легкие и вкусные кето-ужины' },
  { id: 'snacks', name: 'Перекусы', icon: '🥜', desc: 'Полезные кето-перекусы между приемами пищи' },
  { id: 'desserts', name: 'Десерты', icon: '🍰', desc: 'Сладкие кето-десерты без сахара' },
]

// Данные рецептов
const recipes: Record<string, Recipe[]> = {
  breakfast: [
    {
      id: 'b1',
      name: 'Омлет с авокадо и сыром',
      image: '/img/recipes/avocado-cheese-omlet.jpg',
      time: 15,
      calories: 450,
      protein: 25,
      fat: 38,
      carbs: 4,
      ingredients: ['3 яйца', '1/2 авокадо', '50г сыра чеддер', '1 ст.л. сливочного масла', 'Соль, перец'],
      instructions: [
        'Взбейте яйца с солью и перцем',
        'Растопите масло на сковороде на среднем огне',
        'Вылейте яйца и готовьте 2-3 минуты',
        'Добавьте нарезанный авокадо и сыр на одну половину',
        'Сложите омлет пополам и готовьте ещё 1 минуту',
      ],
    },
    {
      id: 'b2',
      name: 'Яичница с беконом и шпинатом',
      image: '/img/recipes/bacon-eggs-spinach.jpg',
      time: 10,
      calories: 520,
      protein: 32,
      fat: 42,
      carbs: 2,
      ingredients: ['3 яйца', '100г бекона', '50г шпината', '1 ст.л. оливкового масла', 'Соль, перец'],
      instructions: [
        'Обжарьте бекон до хрустящей корочки',
        'Добавьте шпинат и обжарьте 1 минуту',
        'Разбейте яйца и жарьте до готовности',
        'Приправьте солью и перцем',
      ],
    },
    {
      id: 'b3',
      name: 'Чиа-пудинг с кокосовым молоком',
      image: '/img/recipes/chia-coconut-pudding.jpg',
      time: 5,
      calories: 280,
      protein: 6,
      fat: 22,
      carbs: 8,
      ingredients: ['3 ст.л. семян чиа', '200мл кокосового молока', '1 ч.л. эритритола', 'Ягоды для украшения'],
      instructions: [
        'Смешайте семена чиа с кокосовым молоком',
        'Добавьте эритритол и перемешайте',
        'Поставьте в холодильник на ночь',
        'Украсьте ягодами перед подачей',
      ],
    },
  ],
  lunch: [
    {
      id: 'l1',
      name: 'Кето Цезарь с курицей',
      image: '/img/recipes/keto-caesar-salad.jpg',
      time: 20,
      calories: 550,
      protein: 42,
      fat: 40,
      carbs: 5,
      ingredients: ['200г куриной грудки', 'Романо/айсберг', '50г пармезана', 'Бекон 50г', 'Заправка Цезарь'],
      instructions: [
        'Обжарьте куриную грудку до готовности',
        'Нарежьте салат и выложите на тарелку',
        'Добавьте нарезанную курицу и бекон',
        'Посыпьте пармезаном и полейте заправкой',
      ],
    },
    {
      id: 'l2',
      name: 'Крем-суп из брокколи',
      image: '/img/recipes/creamy-broccoli-soup.jpg',
      time: 25,
      calories: 320,
      protein: 12,
      fat: 26,
      carbs: 8,
      ingredients: ['300г брокколи', '200мл сливок 33%', '50г сливочного масла', 'Чеснок, соль, перец'],
      instructions: [
        'Отварите брокколи до мягкости',
        'Обжарьте чеснок на масле',
        'Добавьте брокколи и сливки',
        'Пюрируйте блендером до однородности',
        'Приправьте по вкусу',
      ],
    },
    {
      id: 'l3',
      name: 'Тунец в лодочках из салата',
      image: '/img/recipes/tuna-lettuce-boats.jpg',
      time: 10,
      calories: 380,
      protein: 35,
      fat: 25,
      carbs: 3,
      ingredients: ['150г тунца', 'Листья романо', '2 ст.л. майонеза', 'Огурец, лук', 'Лимонный сок'],
      instructions: [
        'Смешайте тунец с майонезом',
        'Добавьте нарезанный огурец и лук',
        'Сбрызните лимонным соком',
        'Выложите в листья салата',
      ],
    },
  ],
  dinner: [
    {
      id: 'd1',
      name: 'Стейк с зелёным салатом',
      image: '/img/recipes/beef-steak-green-salad.jpg',
      time: 20,
      calories: 650,
      protein: 52,
      fat: 48,
      carbs: 3,
      ingredients: ['250г говядины рибай', 'Смесь салатов', 'Оливковое масло', 'Соль, перец, розмарин'],
      instructions: [
        'Достаньте мясо за 30 минут до готовки',
        'Посолите и поперчите стейк',
        'Обжарьте по 3-4 минуты с каждой стороны',
        'Дайте отдохнуть 5 минут',
        'Подавайте с салатом и маслом',
      ],
    },
    {
      id: 'd2',
      name: 'Запечённый лосось с лимоном',
      image: '/img/recipes/baked-salmon-lemon-herbs.jpg',
      time: 25,
      calories: 480,
      protein: 40,
      fat: 34,
      carbs: 2,
      ingredients: ['200г филе лосося', 'Лимон', 'Укроп', 'Оливковое масло', 'Чеснок'],
      instructions: [
        'Разогрейте духовку до 200°C',
        'Выложите лосось на фольгу',
        'Полейте маслом, посыпьте укропом',
        'Добавьте дольки лимона',
        'Запекайте 15-20 минут',
      ],
    },
    {
      id: 'd3',
      name: 'Курица с грибами в сливках',
      image: '/img/recipes/chicken-mushroom-cream.jpg',
      time: 30,
      calories: 520,
      protein: 45,
      fat: 36,
      carbs: 5,
      ingredients: ['300г куриного филе', '200г шампиньонов', '150мл сливок', 'Чеснок', 'Тимьян'],
      instructions: [
        'Нарежьте курицу и обжарьте до золотистого цвета',
        'Добавьте нарезанные грибы',
        'Обжаривайте 5-7 минут',
        'Влейте сливки и добавьте чеснок',
        'Тушите 10 минут до готовности',
      ],
    },
  ],
  snacks: [
    {
      id: 's1',
      name: 'Огурцы с кремовым сыром',
      image: '/img/recipes/cucumber-cream-cheese-rolls.jpg',
      time: 5,
      calories: 150,
      protein: 6,
      fat: 12,
      carbs: 4,
      ingredients: ['2 огурца', '100г сливочного сыра', 'Укроп', 'Чеснок'],
      instructions: [
        'Нарежьте огурцы кружочками',
        'Смешайте сыр с укропом и чесноком',
        'Выложите сыр на огурцы',
      ],
    },
    {
      id: 's2',
      name: 'Фаршированные яйца с авокадо',
      image: '/img/recipes/deviled-eggs-avocado.jpg',
      time: 15,
      calories: 220,
      protein: 12,
      fat: 18,
      carbs: 2,
      ingredients: ['4 яйца', '1 авокадо', 'Лимонный сок', 'Соль, паприка'],
      instructions: [
        'Отварите яйца вкрутую',
        'Разрежьте пополам, выньте желтки',
        'Смешайте желтки с авокадо',
        'Наполните белки смесью',
        'Посыпьте паприкой',
      ],
    },
    {
      id: 's3',
      name: 'Сырная тарелка с орехами',
      image: '/img/recipes/nuts-cheese-plate.jpg',
      time: 5,
      calories: 350,
      protein: 18,
      fat: 30,
      carbs: 4,
      ingredients: ['Сыр бри 50г', 'Чеддер 50г', 'Миндаль 30г', 'Грецкие орехи 30г'],
      instructions: [
        'Нарежьте сыры',
        'Выложите на доску с орехами',
        'Подавайте сразу',
      ],
    },
  ],
  desserts: [
    {
      id: 'ds1',
      name: 'Шоколадный мусс',
      image: '/img/recipes/keto-chocolate-mousse.jpg',
      time: 10,
      calories: 280,
      protein: 4,
      fat: 26,
      carbs: 6,
      ingredients: ['1 авокадо', '30г какао', '50г эритритола', '100мл кокосовых сливок', 'Ваниль'],
      instructions: [
        'Смешайте все ингредиенты в блендере',
        'Взбейте до однородной массы',
        'Разложите по креманкам',
        'Охладите 30 минут перед подачей',
      ],
    },
    {
      id: 'ds2',
      name: 'Чизкейк в стаканчике',
      image: '/img/recipes/berry-cheesecake-cup.jpg',
      time: 15,
      calories: 320,
      protein: 8,
      fat: 28,
      carbs: 6,
      ingredients: ['200г сливочного сыра', '50г эритритола', 'Ваниль', 'Ягоды', 'Миндальная крошка'],
      instructions: [
        'Взбейте сыр с эритритолом',
        'Добавьте ваниль',
        'Выложите слой миндальной крошки',
        'Добавьте крем и ягоды',
      ],
    },
    {
      id: 'ds3',
      name: 'Миндальное печенье',
      image: '/img/recipes/almond-keto-cookies.jpg',
      time: 25,
      calories: 95,
      protein: 3,
      fat: 8,
      carbs: 2,
      ingredients: ['200г миндальной муки', '80г эритритола', '1 яйцо', 'Ваниль', 'Щепотка соли'],
      instructions: [
        'Смешайте все сухие ингредиенты',
        'Добавьте яйцо и замесите тесто',
        'Сформируйте печенье',
        'Выпекайте 12-15 минут при 175°C',
      ],
    },
  ],
}

interface Recipe {
  id: string
  name: string
  image: string
  time: number
  calories: number
  protein: number
  fat: number
  carbs: number
  ingredients: string[]
  instructions: string[]
}

export default function KetoFoodPage() {
  const [activeCategory, setActiveCategory] = useState('breakfast')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [portions, setPortions] = useState(1)

  // Скачать PDF гайд
  const downloadGuide = (pdfUrl: string, title: string) => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${title.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Умножить ингредиенты на количество порций
  const multiplyIngredient = (ingredient: string, multiplier: number): string => {
    if (multiplier === 1) return ingredient
    
    // Регулярка для поиска чисел в начале ингредиента
    const match = ingredient.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*(.*)/)
    if (match) {
      const num = eval(match[1]) * multiplier
      const rest = match[2]
      // Округляем до 1 знака после запятой
      const roundedNum = Math.round(num * 10) / 10
      return `${roundedNum} ${rest}`
    }
    return ingredient
  }

  const downloadRecipePDF = (recipe: Recipe, portionCount: number = 1) => {
    // Пересчитываем ингредиенты на количество порций
    const adjustedIngredients = recipe.ingredients.map(i => multiplyIngredient(i, portionCount))
    
    // Пересчитываем КБЖУ
    const adjustedCalories = Math.round(recipe.calories * portionCount)
    const adjustedProtein = Math.round(recipe.protein * portionCount)
    const adjustedFat = Math.round(recipe.fat * portionCount)
    const adjustedCarbs = Math.round(recipe.carbs * portionCount)

    // Создаём HTML контент для PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${recipe.name} - Кето рецепт (${portionCount} порц.)</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
          h1 { color: #00D9FF; border-bottom: 2px solid #00D9FF; padding-bottom: 10px; }
          .portions { background: #E8F5E9; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px; color: #2E7D32; font-weight: bold; }
          .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
          .stat { background: #f5f5f5; padding: 15px 20px; border-radius: 8px; text-align: center; min-width: 100px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #333; }
          .stat-label { font-size: 12px; color: #666; }
          h2 { color: #333; margin-top: 30px; }
          ul, ol { line-height: 2; }
          li { margin-bottom: 8px; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          .time { color: #666; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>🥑 ${recipe.name}</h1>
        <div class="portions">👥 Расчёт на ${portionCount} ${portionCount === 1 ? 'порцию' : portionCount < 5 ? 'порции' : 'порций'}</div>
        <p class="time">⏱️ Время приготовления: ${recipe.time} минут</p>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${adjustedCalories}</div>
            <div class="stat-label">Калории</div>
          </div>
          <div class="stat">
            <div class="stat-value">${adjustedProtein}г</div>
            <div class="stat-label">Белки</div>
          </div>
          <div class="stat">
            <div class="stat-value">${adjustedFat}г</div>
            <div class="stat-label">Жиры</div>
          </div>
          <div class="stat">
            <div class="stat-value">${adjustedCarbs}г</div>
            <div class="stat-label">Углеводы</div>
          </div>
        </div>
        
        <h2>📝 Ингредиенты (на ${portionCount} ${portionCount === 1 ? 'порцию' : portionCount < 5 ? 'порции' : 'порций'}):</h2>
        <ul>
          ${adjustedIngredients.map(i => `<li>${i}</li>`).join('')}
        </ul>
        
        <h2>👨‍🍳 Приготовление:</h2>
        <ol>
          ${recipe.instructions.map(i => `<li>${i}</li>`).join('')}
        </ol>
        
        <div class="footer">
          <p>🥗 Course Health - Кето рецепты</p>
          <p>course-sport.vercel.app</p>
        </div>
      </body>
      </html>
    `
    
    // Создаём Blob и скачиваем
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recipe.name.replace(/\s+/g, '_')}_${portionCount}_порций.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen pt-28 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-gold/10 border border-accent-gold/30 mb-6">
            <span className="text-2xl">🍽️</span>
            <span className="text-accent-gold font-semibold">Кето-рецепты</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            100 лучших кето-рецептов
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            От завтрака до ужина. Вкусные и полезные блюда для кето-диеты с расчётом КБЖУ
          </p>
        </motion.div>
      </section>

      {/* Keto Product Guides Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">
            📚 Гайды по кето продуктам
          </h2>
          <p className="text-white/60">Скачайте PDF со списками разрешённых и запрещённых продуктов</p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ketoGuides.map((guide, index) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`glass rounded-2xl p-6 border ${guide.borderClass} hover:scale-[1.02] transition-transform`}
            >
              <div className="text-4xl mb-4">{guide.icon}</div>
              <h3 className={`font-bold text-lg ${guide.colorClass} mb-2`}>{guide.title}</h3>
              <p className="text-white/60 text-sm mb-4">{guide.description}</p>
              <a
                href={guide.pdfUrl}
                download
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-dark-900 font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,107,53,0.5),0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,107,53,0.7),0_0_50px_rgba(255,215,0,0.5)] hover:scale-105 transition-all duration-300 border-2 border-yellow-300/50"
              >
                <Download className="w-5 h-5" />
                📥 Скачать PDF
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-accent-electric text-dark-900'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl mr-2">{category.icon}</span>
              {category.name}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Food Items Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: activeCategory === category.id ? 1 : 0 }}
            className={activeCategory === category.id ? 'block' : 'hidden'}
          >
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">
                <span className="gradient-text">{category.name}</span>
              </h2>
              <p className="text-white/60">{category.desc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes[category.id]?.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform group"
                >
                  <div 
                    className="relative aspect-video cursor-pointer"
                    onClick={() => { setSelectedRecipe(recipe); setPortions(1) }}
                  >
                    <Image
                      src={recipe.image}
                      alt={recipe.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-white text-lg">{recipe.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-white/60">
                          <Clock className="w-4 h-4" />
                          {recipe.time} мин
                        </span>
                        <span className="flex items-center gap-1 text-accent-flame">
                          <Flame className="w-4 h-4" />
                          {recipe.calories} ккал
                        </span>
                      </div>
                      <span className="text-accent-neon text-xs">
                        Б:{recipe.protein} Ж:{recipe.fat} У:{recipe.carbs}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedRecipe(recipe); setPortions(1) }}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Смотреть рецепт
                      </button>
                      <button
                        onClick={() => downloadRecipePDF(recipe, 1)}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-dark-900 font-bold shadow-[0_0_10px_rgba(255,107,53,0.4)] hover:shadow-[0_0_20px_rgba(255,107,53,0.6)] hover:scale-110 transition-all duration-300 border border-yellow-300/50"
                        title="Скачать PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Recipe Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/90 backdrop-blur-md"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Image */}
              <div className="relative aspect-video">
                <Image
                  src={selectedRecipe.image}
                  alt={selectedRecipe.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-dark-900/50 flex items-center justify-center hover:bg-dark-900 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="font-display font-bold text-2xl text-white mb-2">{selectedRecipe.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedRecipe.time} мин
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-accent-flame" />
                      {selectedRecipe.calories} ккал
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Portion Selector */}
                <div className="mb-6 p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent-teal" />
                      <span className="font-medium text-white">Количество порций</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPortions(Math.max(1, portions - 1))}
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </button>
                      <span className="w-12 text-center text-2xl font-bold text-accent-teal">{portions}</span>
                      <button
                        onClick={() => setPortions(Math.min(10, portions + 1))}
                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Macros - пересчитанные на порции */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <div className="text-xl font-bold text-white">{Math.round(selectedRecipe.calories * portions)}</div>
                    <div className="text-xs text-white/60">Калории</div>
                  </div>
                  <div className="p-3 rounded-xl bg-accent-electric/10 text-center">
                    <div className="text-xl font-bold text-accent-electric">{Math.round(selectedRecipe.protein * portions)}г</div>
                    <div className="text-xs text-white/60">Белки</div>
                  </div>
                  <div className="p-3 rounded-xl bg-accent-gold/10 text-center">
                    <div className="text-xl font-bold text-accent-gold">{Math.round(selectedRecipe.fat * portions)}г</div>
                    <div className="text-xs text-white/60">Жиры</div>
                  </div>
                  <div className="p-3 rounded-xl bg-accent-neon/10 text-center">
                    <div className="text-xl font-bold text-accent-neon">{Math.round(selectedRecipe.carbs * portions)}г</div>
                    <div className="text-xs text-white/60">Углеводы</div>
                  </div>
                </div>

                {/* Ingredients - пересчитанные на порции */}
                <div className="mb-6">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">📝</span> Ингредиенты
                    <span className="text-sm font-normal text-white/50">(на {portions} {portions === 1 ? 'порцию' : portions < 5 ? 'порции' : 'порций'})</span>
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-center gap-2 text-white/80">
                        <span className="w-2 h-2 rounded-full bg-accent-electric" />
                        {multiplyIngredient(ingredient, portions)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div className="mb-6">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5" /> Приготовление
                  </h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3 text-white/80">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/20 text-accent-gold text-sm flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Download Button - ЯРКАЯ КНОПКА */}
                <button
                  onClick={() => downloadRecipePDF(selectedRecipe, portions)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-dark-900 font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,107,53,0.6),0_0_50px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_rgba(255,107,53,0.8),0_0_80px_rgba(255,215,0,0.6)] hover:scale-[1.02] transition-all duration-300 border-2 border-yellow-300/60"
                >
                  <Download className="w-6 h-6" />
                  📥 Скачать рецепт на {portions} {portions === 1 ? 'порцию' : portions < 5 ? 'порции' : 'порций'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Вернуться к курсам
        </Link>
      </div>
    </main>
  )
}
