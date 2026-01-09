'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, Shuffle, Download, Clock, Flame, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { jsPDF } from 'jspdf'

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

// Рецепты завтраков (15 штук)
const BREAKFAST_RECIPES: Recipe[] = [
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
  {
    id: 'b4',
    name: 'Яйца Бенедикт на кето-булочке',
    image: '/img/recipes/eggs-benedict-keto.jpg',
    time: 20,
    calories: 520,
    protein: 28,
    fat: 42,
    carbs: 4,
    ingredients: ['2 яйца', 'Кето-булочка', '100г бекона', 'Голландский соус', 'Укроп'],
    instructions: [
      'Приготовьте кето-булочку',
      'Обжарьте бекон до хрустящей корочки',
      'Приготовьте яйца пашот',
      'Соберите: булочка, бекон, яйца, соус',
      'Украсьте укропом',
    ],
  },
  {
    id: 'b5',
    name: 'Скрэмбл с лососем и каперсами',
    image: '/img/recipes/scrambled-eggs-salmon.jpg',
    time: 12,
    calories: 460,
    protein: 32,
    fat: 34,
    carbs: 3,
    ingredients: ['3 яйца', '100г копченого лосося', '1 ст.л. каперсов', '1 ст.л. сливочного масла', 'Укроп'],
    instructions: [
      'Взбейте яйца',
      'Растопите масло на сковороде',
      'Готовьте яйца на медленном огне',
      'Добавьте лосось и каперсы',
      'Посыпьте укропом',
    ],
  },
  {
    id: 'b6',
    name: 'Запеченные яйца в авокадо',
    image: '/img/recipes/baked-eggs-avocado.jpg',
    time: 15,
    calories: 390,
    protein: 16,
    fat: 32,
    carbs: 8,
    ingredients: ['2 авокадо', '4 яйца', '50г бекона', 'Соль, перец', 'Зеленый лук'],
    instructions: [
      'Разрежьте авокадо пополам',
      'Удалите немного мякоти',
      'Разбейте яйцо в каждую половину',
      'Посолите, поперчите',
      'Запекайте 12-15 минут при 200°C',
      'Украсьте беконом и зеленым луком',
    ],
  },
  {
    id: 'b7',
    name: 'Кето-гранола с греческим йогуртом',
    image: '/img/recipes/keto-granola-yogurt.jpg',
    time: 25,
    calories: 380,
    protein: 18,
    fat: 30,
    carbs: 8,
    ingredients: ['100г миндаля', '50г кокосовой стружки', '30г семян чиа', '200г греческого йогурта', 'Ягоды'],
    instructions: [
      'Измельчите миндаль и кокос',
      'Смешайте с семенами чиа',
      'Обжарьте в духовке 15 минут при 180°C',
      'Подавайте с йогуртом и ягодами',
    ],
  },
  {
    id: 'b8',
    name: 'Смузи с MCT-маслом и ягодами',
    image: '/img/recipes/smoothie-mct-berries.jpg',
    time: 5,
    calories: 340,
    protein: 12,
    fat: 28,
    carbs: 6,
    ingredients: ['200мл кокосового молока', '1 ст.л. MCT-масла', '50г замороженных ягод', 'Коллаген 30г', 'Лед'],
    instructions: [
      'Поместите все ингредиенты в блендер',
      'Взбейте до однородной консистенции',
      'Добавьте лед',
      'Подавайте сразу',
    ],
  },
  {
    id: 'b9',
    name: 'Творожные кето-оладьи',
    image: '/img/recipes/keto-cottage-pancakes.jpg',
    time: 15,
    calories: 420,
    protein: 24,
    fat: 32,
    carbs: 6,
    ingredients: ['200г творога', '3 яйца', '50г миндальной муки', '1 ч.л. разрыхлителя', 'Кокосовое масло'],
    instructions: [
      'Смешайте творог с яйцами',
      'Добавьте муку и разрыхлитель',
      'Разогрейте масло на сковороде',
      'Жарьте оладьи по 3-4 минуты с каждой стороны',
    ],
  },
  {
    id: 'b10',
    name: 'Кето-маффины с черникой',
    image: '/img/recipes/keto-blueberry-muffins.jpg',
    time: 30,
    calories: 280,
    protein: 8,
    fat: 24,
    carbs: 5,
    ingredients: ['150г миндальной муки', '80г эритритола', '3 яйца', '50г черники', '1 ч.л. ванили'],
    instructions: [
      'Смешайте муку с эритритолом',
      'Добавьте яйца и ваниль',
      'Аккуратно введите чернику',
      'Разложите по формочкам',
      'Выпекайте 20-25 минут при 180°C',
    ],
  },
  {
    id: 'b11',
    name: 'Бекон-вафли',
    image: '/img/recipes/bacon-waffles.jpg',
    time: 15,
    calories: 480,
    protein: 28,
    fat: 38,
    carbs: 4,
    ingredients: ['200г бекона', '3 яйца', '50г миндальной муки', '1 ст.л. кокосового масла', 'Соль, перец'],
    instructions: [
      'Обжарьте бекон до хрустящей корочки',
      'Смешайте яйца с мукой',
      'Добавьте измельченный бекон',
      'Выпекайте в вафельнице 5-7 минут',
    ],
  },
  {
    id: 'b12',
    name: 'Омлет со шпинатом и авокадо',
    image: '/img/recipes/spinach-avocado-omelet.jpg',
    time: 12,
    calories: 410,
    protein: 24,
    fat: 30,
    carbs: 7,
    ingredients: ['3 яйца', '80г шпината', '1/2 авокадо', '1 ст.л. кокосового масла', 'Соль, перец'],
    instructions: [
      'Взбейте яйца с солью и перцем',
      'Нарежьте авокадо кубиками',
      'Разогрейте кокосовое масло на сковороде',
      'Добавьте шпинат и обжаривайте 1 минуту',
      'Влейте яйца и готовьте 2-3 минуты',
      'Подавайте с авокадо',
    ],
  },
  {
    id: 'b13',
    name: 'Кето-кексы с лимоном',
    image: '/img/recipes/keto-lemon-cupcakes.jpg',
    time: 35,
    calories: 240,
    protein: 6,
    fat: 22,
    carbs: 5,
    ingredients: ['150г миндальной муки', '80г эритритола', '3 яйца', 'Лимонный сок', 'Лимонная цедра', 'Кокосовое масло'],
    instructions: [
      'Смешайте муку с эритритолом',
      'Добавьте яйца, сок и цедру лимона',
      'Добавьте растопленное масло',
      'Разложите по формочкам',
      'Выпекайте 20-25 минут при 180°C',
    ],
  },
  {
    id: 'b14',
    name: 'Яичница с грибами и сыром',
    image: '/img/recipes/eggs-mushrooms-cheese.jpg',
    time: 15,
    calories: 440,
    protein: 26,
    fat: 34,
    carbs: 5,
    ingredients: ['3 яйца', '150г шампиньонов', '50г сыра', '1 ст.л. сливочного масла', 'Зеленый лук', 'Соль, перец'],
    instructions: [
      'Нарежьте грибы и обжарьте на масле',
      'Разбейте яйца в сковороду',
      'Добавьте сыр и готовьте до готовности',
      'Посыпьте зеленым луком',
    ],
  },
  {
    id: 'b15',
    name: 'Кето-хлеб с яйцом и авокадо',
    image: '/img/recipes/keto-bread-egg-avocado.jpg',
    time: 20,
    calories: 500,
    protein: 22,
    fat: 40,
    carbs: 6,
    ingredients: ['2 ломтика кето-хлеба', '2 яйца', '1/2 авокадо', 'Соль, перец', 'Оливковое масло'],
    instructions: [
      'Обжарьте кето-хлеб',
      'Приготовьте яйца (жареные или пашот)',
      'Нарежьте авокадо',
      'Соберите тост: хлеб, авокадо, яйца',
      'Посолите и поперчите',
    ],
  },
]

// Рецепты десертов
const DESSERT_RECIPES: Recipe[] = [
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
  {
    id: 'ds4',
    name: 'Кето-мороженое с ванилью',
    image: '/img/recipes/keto-vanilla-ice-cream.jpg',
    time: 20,
    calories: 320,
    protein: 6,
    fat: 30,
    carbs: 5,
    ingredients: ['400мл кокосовых сливок', '50г эритритола', 'Ваниль', 'Яичные желтки 2 шт'],
    instructions: [
      'Взбейте желтки с эритритолом',
      'Подогрейте сливки с ванилью',
      'Смешайте все ингредиенты',
      'Охладите в морозилке 4 часа',
      'Взбейте перед подачей',
    ],
  },
  {
    id: 'ds5',
    name: 'Кето-брауни',
    image: '/img/recipes/keto-brownies.jpg',
    time: 40,
    calories: 280,
    protein: 8,
    fat: 24,
    carbs: 6,
    ingredients: ['150г миндальной муки', '80г какао', '100г эритритола', '3 яйца', '100г кокосового масла'],
    instructions: [
      'Растопите кокосовое масло',
      'Смешайте все сухие ингредиенты',
      'Добавьте яйца и масло',
      'Вылейте в форму',
      'Выпекайте 25-30 минут при 180°C',
    ],
  },
  {
    id: 'ds6',
    name: 'Кето-тирамису',
    image: '/img/recipes/keto-tiramisu.jpg',
    time: 30,
    calories: 340,
    protein: 10,
    fat: 30,
    carbs: 6,
    ingredients: ['300г маскарпоне', '50г эритритола', 'Кофе', 'Какао', 'Яйца 2 шт', 'Ваниль'],
    instructions: [
      'Взбейте желтки с эритритолом',
      'Добавьте маскарпоне и ваниль',
      'Взбейте белки отдельно',
      'Соберите тирамису слоями',
      'Посыпьте какао',
      'Охладите 2 часа',
    ],
  },
  {
    id: 'ds7',
    name: 'Кето-чизкейк',
    image: '/img/recipes/keto-cheesecake.jpg',
    time: 60,
    calories: 360,
    protein: 12,
    fat: 32,
    carbs: 6,
    ingredients: ['600г сливочного сыра', '150г эритритола', '3 яйца', '100г миндальной муки', 'Ваниль'],
    instructions: [
      'Приготовьте основу из миндальной муки',
      'Взбейте сыр с эритритолом и ванилью',
      'Добавьте яйца по одному',
      'Вылейте на основу',
      'Выпекайте 45-50 минут при 160°C',
      'Охладите 4 часа',
    ],
  },
  {
    id: 'ds8',
    name: 'Кето-кексы с лимоном',
    image: '/img/recipes/keto-lemon-cupcakes.jpg',
    time: 35,
    calories: 240,
    protein: 6,
    fat: 22,
    carbs: 5,
    ingredients: ['150г миндальной муки', '80г эритритола', '3 яйца', 'Лимонный сок', 'Лимонная цедра', 'Кокосовое масло'],
    instructions: [
      'Смешайте муку с эритритолом',
      'Добавьте яйца, сок и цедру лимона',
      'Добавьте растопленное масло',
      'Разложите по формочкам',
      'Выпекайте 20-25 минут при 180°C',
    ],
  },
  {
    id: 'ds9',
    name: 'Кето-панна-котта',
    image: '/img/recipes/keto-panna-cotta.jpg',
    time: 20,
    calories: 300,
    protein: 4,
    fat: 28,
    carbs: 5,
    ingredients: ['400мл кокосовых сливок', '50г эритритола', 'Желатин 10г', 'Ваниль', 'Ягоды'],
    instructions: [
      'Замочите желатин',
      'Подогрейте сливки с эритритолом и ванилью',
      'Добавьте желатин',
      'Разлейте по формам',
      'Охладите 4 часа',
      'Подавайте с ягодами',
    ],
  },
  {
    id: 'ds10',
    name: 'Кето-фруктовый салат',
    image: '/img/recipes/keto-fruit-salad.jpg',
    time: 10,
    calories: 180,
    protein: 2,
    fat: 14,
    carbs: 8,
    ingredients: ['100г черники', '100г малины', '50г клубники', '100мл кокосовых сливок', 'Эритритол'],
    instructions: [
      'Нарежьте ягоды',
      'Взбейте сливки с эритритолом',
      'Смешайте ягоды со сливками',
      'Подавайте охлажденным',
    ],
  },
  {
    id: 'ds11',
    name: 'Кето-пудинг из авокадо',
    image: '/img/recipes/keto-avocado-pudding.jpg',
    time: 10,
    calories: 320,
    protein: 4,
    fat: 28,
    carbs: 8,
    ingredients: ['2 авокадо', '50г какао', '60г эритритола', '100мл кокосового молока', 'Ваниль'],
    instructions: [
      'Очистите авокадо',
      'Поместите все в блендер',
      'Взбейте до однородной массы',
      'Разложите по креманкам',
      'Охладите 1 час',
    ],
  },
  {
    id: 'ds12',
    name: 'Кето-кексы с шоколадом',
    image: '/img/recipes/keto-chocolate-cupcakes.jpg',
    time: 35,
    calories: 260,
    protein: 7,
    fat: 24,
    carbs: 5,
    ingredients: ['150г миндальной муки', '80г какао', '100г эритритола', '3 яйца', 'Кокосовое масло', 'Ваниль'],
    instructions: [
      'Смешайте муку, какао и эритритол',
      'Добавьте яйца, масло и ваниль',
      'Разложите по формочкам',
      'Выпекайте 20-25 минут при 180°C',
    ],
  },
  {
    id: 'ds13',
    name: 'Кето-крем-брюле',
    image: '/img/recipes/keto-creme-brulee.jpg',
    time: 45,
    calories: 350,
    protein: 8,
    fat: 32,
    carbs: 4,
    ingredients: ['400мл кокосовых сливок', '6 яичных желтков', '60г эритритола', 'Ваниль', 'Эритритол для карамели'],
    instructions: [
      'Подогрейте сливки с ванилью',
      'Взбейте желтки с эритритолом',
      'Смешайте и разлейте по формам',
      'Запекайте на водяной бане 30-35 минут',
      'Охладите и посыпьте эритритолом',
      'Карамелизируйте горелкой',
    ],
  },
  {
    id: 'ds14',
    name: 'Кето-маффины с кокосом',
    image: '/img/recipes/keto-coconut-muffins.jpg',
    time: 30,
    calories: 270,
    protein: 7,
    fat: 25,
    carbs: 5,
    ingredients: ['150г миндальной муки', '50г кокосовой стружки', '80г эритритола', '3 яйца', 'Кокосовое масло'],
    instructions: [
      'Смешайте муку, стружку и эритритол',
      'Добавьте яйца и масло',
      'Разложите по формочкам',
      'Выпекайте 20-25 минут при 180°C',
    ],
  },
  {
    id: 'ds15',
    name: 'Кето-творожный десерт',
    image: '/img/recipes/keto-cottage-dessert.jpg',
    time: 10,
    calories: 240,
    protein: 12,
    fat: 20,
    carbs: 4,
    ingredients: ['300г творога', '50г эритритола', 'Ваниль', 'Ягоды', 'Кокосовые сливки'],
    instructions: [
      'Взбейте творог с эритритолом и ванилью',
      'Добавьте ягоды',
      'Подавайте со сливками',
    ],
  },
]

type RecipeType = 'breakfast' | 'dessert'

interface KetoRecipeGeneratorProps {
  type?: RecipeType
}

export function KetoRecipeGenerator({ type = 'breakfast' }: KetoRecipeGeneratorProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [downloading, setDownloading] = useState(false)

  const recipes = type === 'breakfast' ? BREAKFAST_RECIPES : DESSERT_RECIPES
  const title = type === 'breakfast' ? 'Генератор завтраков' : 'Генератор десертов'
  const description = type === 'breakfast' 
    ? 'Случайный завтрак из 15 кето-рецептов' 
    : 'Случайный десерт из 15 кето-рецептов'

  const generateRandomRecipe = () => {
    const randomIndex = Math.floor(Math.random() * recipes.length)
    const randomRecipe = recipes[randomIndex]
    setSelectedRecipe(randomRecipe)
  }

  const downloadPDF = async () => {
    if (!selectedRecipe) {
      alert('Сначала сгенерируйте рецепт!')
      return
    }

    try {
      setDownloading(true)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      let yPos = 25

      // Заголовок
      pdf.setFontSize(24)
      pdf.setTextColor(59, 130, 246)
      pdf.text(selectedRecipe.name, pageWidth / 2, yPos, { align: 'center' })
      yPos += 15

      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Кето-рецепт', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Статистика
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      pdf.text(`⏱ Время приготовления: ${selectedRecipe.time} минут`, margin, yPos)
      yPos += 6
      pdf.text(`🔥 Калории: ${selectedRecipe.calories} ккал`, margin, yPos)
      yPos += 6
      pdf.text(`📊 БЖУ: ${selectedRecipe.protein}Б / ${selectedRecipe.fat}Ж / ${selectedRecipe.carbs}У`, margin, yPos)
      yPos += 10

      // Ингредиенты
      pdf.setFontSize(14)
      pdf.setTextColor(59, 130, 246)
      pdf.text('Ингредиенты:', margin, yPos)
      yPos += 8

      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      selectedRecipe.ingredients.forEach(ing => {
        pdf.text(`• ${ing}`, margin + 5, yPos)
        yPos += 5
      })
      yPos += 5

      // Инструкция
      pdf.setFontSize(14)
      pdf.setTextColor(59, 130, 246)
      pdf.text('Приготовление:', margin, yPos)
      yPos += 8

      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      selectedRecipe.instructions.forEach((step, idx) => {
        const stepLines = pdf.splitTextToSize(`${idx + 1}. ${step}`, pageWidth - 2 * margin - 10)
        pdf.text(stepLines, margin + 5, yPos)
        yPos += stepLines.length * 5
      })

      const fileName = `${selectedRecipe.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
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
      className="mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-dark-800/50 to-teal-500/10 border-2 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-white/60 text-xs sm:text-sm">{description}</p>
        </div>
      </div>

      {/* Кнопка генерации */}
      <button
        onClick={generateRandomRecipe}
        className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
      >
        <Shuffle className="w-5 h-5" />
        <span>Сгенерировать {type === 'breakfast' ? 'завтрак' : 'десерт'}</span>
      </button>

      {/* Сгенерированный рецепт */}
      {selectedRecipe && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-xl bg-white/5 border-2 border-emerald-500/30"
        >
          {/* Изображение */}
          <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-4">
            <Image
              src={selectedRecipe.image}
              alt={selectedRecipe.name}
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback если изображение не загрузилось
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            {selectedRecipe.image.includes('recipes/') && (
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
            )}
          </div>

          {/* Название и статистика */}
          <div className="mb-4">
            <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">{selectedRecipe.name}</h4>
            <div className="flex flex-wrap gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedRecipe.time} мин
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {selectedRecipe.calories} ккал
              </span>
              <span className="text-emerald-400">
                Б:{selectedRecipe.protein} Ж:{selectedRecipe.fat} У:{selectedRecipe.carbs}
              </span>
            </div>
          </div>

          {/* Ингредиенты */}
          <div className="mb-4">
            <h5 className="text-white font-medium mb-2 flex items-center gap-2">
              <span className="text-xl">📝</span> Ингредиенты
            </h5>
            <ul className="space-y-1.5">
              {selectedRecipe.ingredients.map((ing, idx) => (
                <li key={idx} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                  <span className="break-words">{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Инструкция */}
          <div className="mb-4">
            <h5 className="text-white font-medium mb-2 flex items-center gap-2">
              <ChefHat className="w-4 h-4" /> Приготовление
            </h5>
            <ol className="space-y-2">
              {selectedRecipe.instructions.map((step, idx) => (
                <li key={idx} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="text-emerald-400 font-medium flex-shrink-0">{idx + 1}.</span>
                  <span className="break-words">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Кнопка скачать PDF */}
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-dark-900 font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                <span>Создание PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Скачать рецепт в PDF</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

