'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, UtensilsCrossed, ShoppingCart, Download, Check, X, Sparkles, ChefHat } from 'lucide-react'
import Image from 'next/image'
import { ketoRecipesData } from './ketoRecipesData'
import { enhancedMealsDatabase, AVAILABLE_PRODUCTS_LIST } from './enhancedMealsData'

export type CookingMethod = 'cold' | 'hot' // Холодные/горячие блюда
export type DishType = 'snack' | 'first' | 'second' | 'dessert' // Закуски, первые, вторые, кондитерские
export type ProcessingMethod = 'sous_vide' | 'frying' | 'baking' | 'boiling' | 'steaming' | 'grilling' | 'air_frying' // Способы обработки

export interface Meal {
  name: string
  calories: number
  fats: number
  proteins: number
  carbs: number
  prepTime: number
  image?: string
  ingredients?: string[]
  instructions?: string[]
  description?: string
  estimatedCost?: number
  cookingMethod?: CookingMethod // Холодное/горячее
  dishType?: DishType // Первое/второе/кондитерское
  processingMethod?: ProcessingMethod // Способ обработки
  availableProducts?: string[] // Продукты, из которых можно приготовить это блюдо
}

interface DayMenu {
  day: string
  date?: string
  breakfast?: Meal
  lunch?: Meal
  dinner?: Meal
  snack?: Meal
  dessert?: Meal
}

// База данных блюд - используем все рецепты из кето-рецептов
const MEALS_DATABASE: Record<string, Meal[]> = ketoRecipesData

// Список продуктов для исключения (используется полный список из AVAILABLE_PRODUCTS_LIST)
// Для удобства оставляем небольшой список популярных продуктов
const COMMON_PRODUCTS = AVAILABLE_PRODUCTS_LIST.slice(0, 30) // Первые 30 продуктов для быстрого выбора

export function MenuGenerator() {
  const [generationMode, setGenerationMode] = useState<'full_menu' | 'single_dish'>('full_menu')
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'full'>('full')
  const [productFilter, setProductFilter] = useState<'all' | 'exclude' | 'include'>('all')
  const [excludedProducts, setExcludedProducts] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]) // Для режима "одно блюдо по продуктам"
  const [dishesCount, setDishesCount] = useState<1 | 3 | 5>(1) // Количество блюд для генерации
  const [targetCalories, setTargetCalories] = useState('2000')
  const [generatedMenu, setGeneratedMenu] = useState<DayMenu[]>([])
  const [generatedSingleDish, setGeneratedSingleDish] = useState<Meal | null>(null)
  const [generatedDishes, setGeneratedDishes] = useState<Meal[]>([]) // Несколько блюд
  const [downloading, setDownloading] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  
  // Фильтры для полного меню
  const [cookingMethod, setCookingMethod] = useState<CookingMethod | 'all'>('all') // Холодные/горячие
  const [dishType, setDishType] = useState<DishType | 'all'>('all') // Первые/вторые/кондитерские
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod | 'all'>('all') // Способ обработки

  // Фильтрация блюд по всем параметрам
  const filterMeals = (meals: Meal[]): Meal[] => {
    let filtered = meals

    // Фильтр по способу приготовления (холодные/горячие)
    if (cookingMethod !== 'all') {
      filtered = filtered.filter(meal => meal.cookingMethod === cookingMethod)
    }

    // Фильтр по типу блюда (закуски/первые/вторые/кондитерские)
    if (dishType !== 'all') {
      filtered = filtered.filter(meal => meal.dishType === dishType)
    }

    // Фильтр по способу обработки
    if (processingMethod !== 'all' && generationMode === 'full_menu') {
      filtered = filtered.filter(meal => meal.processingMethod === processingMethod)
    }

    // Фильтр по исключенным продуктам
    if (productFilter === 'exclude' && excludedProducts.length > 0) {
      filtered = filtered.filter((meal) => {
        const mealIngredients = meal.ingredients?.join(' ') || ''
        return !excludedProducts.some((excluded) =>
          mealIngredients.toLowerCase().includes(excluded.toLowerCase())
        )
      })
    }

    // Фильтр по выбранным продуктам (для режима "одно блюдо")
    if (generationMode === 'single_dish' && selectedProducts.length > 0) {
      filtered = filtered.filter((meal) => {
        // Используем availableProducts если есть, иначе ingredients
        const mealProducts = meal.availableProducts || meal.ingredients || []
        if (mealProducts.length === 0) return false
        
        // Нормализуем названия продуктов для сравнения
        const normalizeProduct = (product: string): string => {
          return product.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/\([^)]*\)/g, '') // Убираем скобки
            .replace(/\d+[гкгмл]*\s*/g, '') // Убираем количество
            .replace(/сыр\s+/g, 'сыр ') // Нормализуем "сыр"
            .trim()
        }
        
        // Нормализуем продукты блюда
        const normalizedMealProducts = mealProducts.map(product => normalizeProduct(product))
        
        // Создаем массив ключевых слов для каждого выбранного продукта
        const selectedKeywords = selectedProducts.map(selected => {
          const normalized = normalizeProduct(selected)
          const words = normalized.split(' ').filter(w => w.length > 2)
          return { original: selected, normalized, words }
        })
        
        // Проверяем, какие выбранные продукты присутствуют в блюде
        const matchingSelectedProducts = selectedKeywords.filter(selected => {
          return normalizedMealProducts.some(mealProduct => {
            const mealWords = mealProduct.split(' ').filter(w => w.length > 2)
            
            // Точное совпадение
            if (mealProduct === selected.normalized) return true
            
            // Проверяем вхождение полного названия
            if (mealProduct.includes(selected.normalized) || selected.normalized.includes(mealProduct)) {
              return true
            }
            
            // Проверяем совпадение ключевых слов (минимум одно слово должно совпадать)
            const hasCommonWord = mealWords.some(mw => 
              selected.words.some(sw => mw === sw || mw.includes(sw) || sw.includes(mw))
            )
            
            // Специальные случаи для сыров
            if (mealProduct.includes('сыр') && selected.normalized.includes('сыр')) {
              const mealCheeseType = mealWords.find(w => w !== 'сыр')
              const selectedCheeseType = selected.words.find(w => w !== 'сыр')
              if (mealCheeseType && selectedCheeseType) {
                return mealCheeseType === selectedCheeseType || 
                       mealCheeseType.includes(selectedCheeseType) || 
                       selectedCheeseType.includes(mealCheeseType)
              }
            }
            
            return hasCommonWord
          })
        })
        
        // Требуем минимум 80% выбранных продуктов должны быть в блюде
        // Если выбрано 1-2 продукта, требуем 100% совпадение
        const minMatchPercentage = selectedKeywords.length <= 2 ? 100 : 80
        const matchPercentage = (matchingSelectedProducts.length / selectedKeywords.length) * 100
        return matchPercentage >= minMatchPercentage
      })
    }

    return filtered
  }

  // Генерация одного или нескольких блюд по выбранным продуктам
  const generateSingleDish = () => {
    if (selectedProducts.length === 0) {
      alert('Выберите хотя бы один продукт из вашего холодильника')
      return
    }

    // Собираем все блюда из расширенной базы данных
    const allMeals: Meal[] = []
    Object.values(enhancedMealsDatabase).forEach(category => {
      allMeals.push(...category)
    })
    // Добавляем блюда из старой базы
    Object.values(MEALS_DATABASE).forEach(category => {
      if (Array.isArray(category)) {
        allMeals.push(...category)
      }
    })

    const filtered = filterMeals(allMeals)

    if (filtered.length === 0) {
      alert('Не найдено блюд, которые можно приготовить из выбранных продуктов. Попробуйте выбрать другие продукты или расширьте список выбранных продуктов.')
      return
    }

    // Если нужно одно блюдо
    if (dishesCount === 1) {
      const randomDish = filtered[Math.floor(Math.random() * filtered.length)]
      setGeneratedSingleDish(randomDish)
      setGeneratedDishes([])
    } else {
      // Генерируем несколько блюд (без повторений)
      const shuffled = [...filtered].sort(() => Math.random() - 0.5)
      const selectedDishes = shuffled.slice(0, Math.min(dishesCount, filtered.length))
      setGeneratedDishes(selectedDishes)
      setGeneratedSingleDish(null)
    }
  }

  // Генерация меню
  const generateMenu = () => {
    const targetCal = parseInt(targetCalories) || 2000
    const daysCount = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    
    const menu: DayMenu[] = []

    // Собираем все доступные блюда из расширенной и старой базы
    const allAvailableMeals: Meal[] = []
    
    // Добавляем блюда из расширенной базы (применяем фильтры)
    Object.values(enhancedMealsDatabase).forEach(category => {
      allAvailableMeals.push(...filterMeals(category))
    })
    
    // Добавляем блюда из старой базы (для завтраков, обедов, ужинов)
    if (MEALS_DATABASE.breakfast) {
      allAvailableMeals.push(...filterMeals(MEALS_DATABASE.breakfast))
    }
    if (MEALS_DATABASE.lunch) {
      allAvailableMeals.push(...filterMeals(MEALS_DATABASE.lunch))
    }
    if (MEALS_DATABASE.dinner) {
      allAvailableMeals.push(...filterMeals(MEALS_DATABASE.dinner))
    }
    if (MEALS_DATABASE.snacks) {
      allAvailableMeals.push(...filterMeals(MEALS_DATABASE.snacks))
    }
    if (MEALS_DATABASE.desserts) {
      allAvailableMeals.push(...filterMeals(MEALS_DATABASE.desserts))
    }

    for (let i = 0; i < daysCount; i++) {
      const dayName = period === 'day' ? 'Сегодня' : period === 'week' ? days[i % 7] : `День ${i + 1}`
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

      let breakfast: Meal | undefined
      let lunch: Meal | undefined
      let dinner: Meal | undefined
      let snack: Meal | undefined
      let dessert: Meal | undefined

      // Генерируем блюда в зависимости от выбранного типа
      if (mealType === 'full' || mealType === 'breakfast') {
        // Фильтруем завтраки (холодные блюда или блюда без типа)
        const breakfastMeals = allAvailableMeals.filter(meal => 
          !meal.dishType || meal.dishType === 'second' || meal.cookingMethod === 'cold'
        )
        if (breakfastMeals.length > 0) {
          breakfast = { ...breakfastMeals[Math.floor(Math.random() * breakfastMeals.length)] }
        }
      }

      if (mealType === 'full' || mealType === 'lunch') {
        // Для обеда: первые или вторые блюда
        const lunchMeals = allAvailableMeals.filter(meal => 
          meal.dishType === 'first' || meal.dishType === 'second' || !meal.dishType
        )
        if (lunchMeals.length > 0) {
          lunch = { ...lunchMeals[Math.floor(Math.random() * lunchMeals.length)] }
        }
      }

      if (mealType === 'full' || mealType === 'dinner') {
        // Для ужина: вторые блюда
        const dinnerMeals = allAvailableMeals.filter(meal => 
          meal.dishType === 'second' || !meal.dishType
        )
        if (dinnerMeals.length > 0) {
          dinner = { ...dinnerMeals[Math.floor(Math.random() * dinnerMeals.length)] }
        }
      }

      // Добавляем snack и dessert только для полного меню
      if (mealType === 'full') {
        const snackMeals = allAvailableMeals.filter(meal => 
          meal.cookingMethod === 'cold' || !meal.dishType
        )
        if (snackMeals.length > 0) {
          snack = { ...snackMeals[Math.floor(Math.random() * snackMeals.length)] }
        }

        const dessertMeals = allAvailableMeals.filter(meal => 
          meal.dishType === 'dessert'
        )
        if (dessertMeals.length > 0) {
          dessert = { ...dessertMeals[Math.floor(Math.random() * dessertMeals.length)] }
        }
      }

      // Корректируем калории под целевое значение (snack и dessert не учитываются в целевых калориях)
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
        // snack и dessert не корректируются по калориям, они остаются как есть
      }

      menu.push({
        day: dayName,
        date: period !== 'day' ? dateStr : undefined,
        breakfast,
        lunch,
        dinner,
        snack,
        dessert,
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
    const mainMeals = {
      calories: (day.breakfast?.calories || 0) + (day.lunch?.calories || 0) + (day.dinner?.calories || 0),
      fats: (day.breakfast?.fats || 0) + (day.lunch?.fats || 0) + (day.dinner?.fats || 0),
      proteins: (day.breakfast?.proteins || 0) + (day.lunch?.proteins || 0) + (day.dinner?.proteins || 0),
      carbs: (day.breakfast?.carbs || 0) + (day.lunch?.carbs || 0) + (day.dinner?.carbs || 0),
    }
    
    const additions = {
      calories: (day.snack?.calories || 0) + (day.dessert?.calories || 0),
      fats: (day.snack?.fats || 0) + (day.dessert?.fats || 0),
      proteins: (day.snack?.proteins || 0) + (day.dessert?.proteins || 0),
      carbs: (day.snack?.carbs || 0) + (day.dessert?.carbs || 0),
    }

    return {
      mainMeals,
      additions,
      total: {
        calories: mainMeals.calories + additions.calories,
        fats: mainMeals.fats + additions.fats,
        proteins: mainMeals.proteins + additions.proteins,
        carbs: mainMeals.carbs + additions.carbs,
      }
    }
  }

  const removeSnackOrDessert = (dayIndex: number, type: 'snack' | 'dessert') => {
    setGeneratedMenu(prev => prev.map((day, index) => {
      if (index === dayIndex) {
        return { ...day, [type]: undefined }
      }
      return day
    }))
  }

  const downloadSingleDishPDF = async (meal: Meal) => {
    try {
      setDownloading(true)

      // Создаем красивый HTML элемент с темными стилями
      const printContent = document.createElement('div')
      printContent.id = 'single-dish-pdf-content'
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '50px'
      printContent.style.background = 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0a0a0b 100%)'
      printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      printContent.style.color = '#ffffff'
      printContent.style.borderRadius = '20px'

      const processingMethodLabel = meal.processingMethod ? getProcessingMethodLabel(meal.processingMethod) : ''
      const dishTypeLabel = meal.dishType === 'first' ? 'Первое блюдо' : meal.dishType === 'second' ? 'Второе блюдо' : meal.dishType === 'dessert' ? 'Десерт' : meal.dishType === 'snack' ? 'Закуска' : ''

      printContent.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.1);
        ">
          <!-- Заголовок -->
          <h1 style="
            font-size: 42px;
            font-weight: bold;
            text-align: center;
            margin: 0 0 10px 0;
            color: #ffd700;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.5);
          ">
            ${meal.name}
          </h1>
          
          <p style="
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            font-size: 16px;
            margin: 0 0 40px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">
            Личный шеф
          </p>
          
          ${meal.description ? `
          <!-- Описание -->
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 35px;
            backdrop-filter: blur(10px);
          ">
            <p style="
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
              line-height: 1.8;
              margin: 0;
            ">
              ${meal.description}
            </p>
          </div>
          ` : ''}
          
          <!-- Информационная карточка -->
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 35px;
            backdrop-filter: blur(10px);
          ">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div style="
                background: rgba(255, 215, 0, 0.15);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
              ">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">⏱ Время</div>
                <div style="font-size: 20px; font-weight: bold; color: #ffd700;">${meal.prepTime} мин</div>
              </div>
              <div style="
                background: rgba(16, 185, 129, 0.15);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
              ">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">🔥 Калории</div>
                <div style="font-size: 20px; font-weight: bold; color: #10b981;">${meal.calories} ккал</div>
              </div>
              <div style="
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
              ">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">💰 Стоимость</div>
                <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${meal.estimatedCost || '—'} ₽</div>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; text-align: center;">
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Белки</div>
                  <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${meal.proteins}г</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Жиры</div>
                  <div style="font-size: 18px; font-weight: bold; color: #ffd700;">${meal.fats}г</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Углеводы</div>
                  <div style="font-size: 18px; font-weight: bold; color: #10b981;">${meal.carbs}г</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Способ</div>
                  <div style="font-size: 14px; font-weight: bold; color: rgba(255, 255, 255, 0.9);">${processingMethodLabel || dishTypeLabel || '—'}</div>
                </div>
              </div>
            </div>
          </div>
          
          ${meal.ingredients && meal.ingredients.length > 0 ? `
          <!-- Ингредиенты -->
          <div style="margin-bottom: 35px;">
            <h2 style="
              font-size: 24px;
              font-weight: bold;
              color: #ffd700;
              margin: 0 0 20px 0;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              <span style="font-size: 28px;">🥘</span>
              Ингредиенты:
            </h2>
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 20px;
              backdrop-filter: blur(10px);
            ">
              <ul style="
                margin: 0;
                padding-left: 0;
                list-style: none;
                line-height: 2;
              ">
                ${meal.ingredients.map((ingredient, idx) => `
                  <li style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 15px;
                    padding: 8px 0;
                    border-bottom: ${idx < meal.ingredients!.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'};
                  ">
                    <span style="
                      display: inline-block;
                      width: 24px;
                      height: 24px;
                      background: linear-gradient(135deg, #ffd700 0%, #00d4ff 100%);
                      border-radius: 50%;
                      text-align: center;
                      line-height: 24px;
                      font-size: 12px;
                      font-weight: bold;
                      color: #0a0a0b;
                      margin-right: 12px;
                    ">${idx + 1}</span>
                    ${ingredient}
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
          ` : ''}
          
          ${meal.instructions && meal.instructions.length > 0 ? `
          <!-- Инструкция -->
          <div>
            <h2 style="
              font-size: 24px;
              font-weight: bold;
              color: #ffd700;
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
              <ol style="
                margin: 0;
                padding-left: 0;
                list-style: none;
                counter-reset: step-counter;
              ">
                ${meal.instructions.map((step, idx) => `
                  <li style="
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 16px;
                    padding-left: 50px;
                    position: relative;
                    line-height: 1.6;
                    font-size: 15px;
                  ">
                    <span style="
                      position: absolute;
                      left: 0;
                      width: 32px;
                      height: 32px;
                      background: linear-gradient(135deg, #ffd700 0%, #00d4ff 100%);
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #0a0a0b;
                      font-weight: bold;
                      font-size: 14px;
                      box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
                    ">${idx + 1}</span>
                    ${step}
                  </li>
                `).join('')}
              </ol>
            </div>
          </div>
          ` : ''}
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

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Если изображение больше одной страницы, разбиваем на несколько страниц
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let yPosition = 0
        
        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight)
          heightLeft -= pageHeight
          
          if (heightLeft > 0) {
            pdf.addPage()
            yPosition -= pageHeight
          }
        }
      }

      const fileName = `${meal.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      
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

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
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
      ctx.fillStyle = '#FFD700' // accent-gold (золотистый)
      ctx.font = 'bold 36px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('Личный шеф', pageWidthPx / 2, yPosPx)
      yPosPx += 50

      // Период и калории
      ctx.fillStyle = '#666666'
      ctx.font = '20px Arial, sans-serif'
      // Определяем текст периода на основе выбранного периода
      let periodText = 'На день'
      if (period === 'week') {
        periodText = 'На неделю'
      } else if (period === 'month') {
        periodText = 'На месяц'
      } else {
        periodText = 'На день'
      }
      ctx.fillText(periodText, pageWidthPx / 2, yPosPx)
      yPosPx += 30
      ctx.fillText(`Целевые калории: ${targetCalories} ккал/день`, pageWidthPx / 2, yPosPx)
      yPosPx += 20
      ctx.font = '12px Arial, sans-serif'
      ctx.fillStyle = '#999999'
      ctx.fillText('* Целевые калории применяются только к основным приемам пищи. Перекусы и десерты не корректируются.', pageWidthPx / 2, yPosPx)
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

        if (day.dessert) {
          ctx.font = 'bold 16px Arial, sans-serif'
          ctx.fillText('Десерт:', marginPx + 10, yPosPx)
          ctx.font = '16px Arial, sans-serif'
          ctx.fillText(day.dessert.name, marginPx + 80, yPosPx)
          yPosPx += 25
          ctx.font = '14px Arial, sans-serif'
          ctx.fillStyle = '#666666'
          ctx.fillText(`  ${day.dessert.calories} ккал | ${day.dessert.fats}г Ж | ${day.dessert.proteins}г Б | ${day.dessert.carbs}г У`, marginPx + 10, yPosPx)
          yPosPx += 30
          ctx.fillStyle = '#000000'
        }

        // Итого
        ctx.font = 'bold 16px Arial, sans-serif'
        ctx.fillStyle = '#10b981'
        const targetCal = parseInt(targetCalories) || 2000
        ctx.fillText(`Основные блюда: ${targetCal} ккал | ${totals.mainMeals.fats}г жиров | ${totals.mainMeals.proteins}г белков | ${totals.mainMeals.carbs}г углеводов`, marginPx, yPosPx)
        yPosPx += 25
        
        if (day.snack || day.dessert) {
          ctx.font = 'bold 16px Arial, sans-serif'
          ctx.fillStyle = '#10b981'
          ctx.fillText(`Всего с дополнениями: ${totals.total.calories} ккал | ${totals.total.fats}г жиров | ${totals.total.proteins}г белков | ${totals.total.carbs}г углеводов`, marginPx, yPosPx)
          yPosPx += 15
        }
        
        yPosPx += 15

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
      className="p-6 rounded-2xl bg-gradient-to-br from-accent-gold/10 via-dark-800/50 to-accent-electric/10 border-2 border-accent-gold/30 shadow-[0_0_30px_rgba(255,215,0,0.2)]"
    >
      {/* Параметры */}
      <div className="space-y-6 mb-8">
        {/* Режим генерации */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Режим генерации
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGenerationMode('full_menu')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                generationMode === 'full_menu'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Полное меню
            </button>
            <button
              onClick={() => setGenerationMode('single_dish')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                generationMode === 'single_dish'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Одно блюдо по продуктам
            </button>
          </div>
        </div>

        {/* Для режима "одно блюдо по продуктам" */}
        {generationMode === 'single_dish' && (
          <>
            {/* Способ приготовления для режима "одно блюдо" */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Способ приготовления
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCookingMethod('all')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    cookingMethod === 'all'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setCookingMethod('cold')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    cookingMethod === 'cold'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Холодные
                </button>
                <button
                  onClick={() => setCookingMethod('hot')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    cookingMethod === 'hot'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Горячие
                </button>
              </div>
            </div>

            {/* Количество блюд */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <ChefHat className="w-4 h-4" />
                Количество блюд
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setDishesCount(1)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishesCount === 1
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  1 блюдо
                </button>
                <button
                  onClick={() => setDishesCount(3)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishesCount === 3
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  3 блюда
                </button>
                <button
                  onClick={() => setDishesCount(5)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishesCount === 5
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  5 блюд
                </button>
              </div>
            </div>

            {/* Тип блюда для режима "одно блюдо" */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Тип блюда
              </label>
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => setDishType('all')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'all'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setDishType('snack')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'snack'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Закуски
                </button>
                <button
                  onClick={() => setDishType('first')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'first'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Первые
                </button>
                <button
                  onClick={() => setDishType('second')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'second'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Вторые
                </button>
                <button
                  onClick={() => setDishType('dessert')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'dessert'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Десерт
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Выберите продукты из вашего холодильника
              </label>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-64 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PRODUCTS_LIST.map((product) => (
                    <button
                      key={product}
                      onClick={() => {
                        if (selectedProducts.includes(product)) {
                          setSelectedProducts(selectedProducts.filter(p => p !== product))
                        } else {
                          setSelectedProducts([...selectedProducts, product])
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedProducts.includes(product)
                          ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {selectedProducts.includes(product) ? (
                        <Check className="w-3 h-3" />
                      ) : null}
                      {product}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Для режима "полное меню" */}
        {generationMode === 'full_menu' && (
          <>
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
                    ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
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
                    ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

            {/* Способ приготовления */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Способ приготовления
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCookingMethod('all')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    cookingMethod === 'all'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setCookingMethod('cold')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    cookingMethod === 'cold'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Холодные
                </button>
                <button
                  onClick={() => setCookingMethod('hot')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    cookingMethod === 'hot'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Горячие
                </button>
              </div>
            </div>

            {/* Тип блюда */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Тип блюда
              </label>
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => setDishType('all')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'all'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setDishType('first')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'first'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Первые
                </button>
                <button
                  onClick={() => setDishType('second')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'second'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Вторые
                </button>
                <button
                  onClick={() => setDishType('dessert')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                    dishType === 'dessert'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Кондитерские
                </button>
              </div>
            </div>

            {/* Способ обработки */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Способ обработки
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setProcessingMethod('all')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'all'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setProcessingMethod('sous_vide')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'sous_vide'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Су-вид
                </button>
                <button
                  onClick={() => setProcessingMethod('frying')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'frying'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Жарка
                </button>
                <button
                  onClick={() => setProcessingMethod('baking')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'baking'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Запекание
                </button>
                <button
                  onClick={() => setProcessingMethod('boiling')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'boiling'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Варка
                </button>
                <button
                  onClick={() => setProcessingMethod('steaming')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'steaming'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Паровая
                </button>
                <button
                  onClick={() => setProcessingMethod('grilling')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'grilling'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Гриль
                </button>
                <button
                  onClick={() => setProcessingMethod('air_frying')}
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                    processingMethod === 'air_frying'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Аэрогриль
                </button>
              </div>
            </div>

            {/* Продукты */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Продукты (исключить)
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => {
                    setProductFilter('all')
                    setExcludedProducts([])
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    productFilter === 'all'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setProductFilter('exclude')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    productFilter === 'exclude'
                      ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900'
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-gold/50 focus:ring-2 focus:ring-accent-gold/20 transition-all"
              />
              {mealType === 'full' && (
                <p className="mt-2 text-xs text-white/60">
                  * Целевые калории применяются только к основным приемам пищи (завтрак, обед, ужин). Перекусы и десерты не корректируются.
                </p>
              )}
            </div>
          </>
        )}

      </div>

      {/* Кнопка генерации */}
      <button
        onClick={() => {
          if (generationMode === 'full_menu') {
            generateMenu()
          } else {
            generateSingleDish()
          }
        }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-gold/30 transition-all mb-4 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        {generationMode === 'full_menu' ? 'Хочу меню' : dishesCount === 1 ? 'Найти блюдо' : `Найти ${dishesCount} блюд`}
      </button>

      {/* Выбранные продукты (для режима "одно блюдо") */}
      {generationMode === 'single_dish' && selectedProducts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Выбранные продукты:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <span
                key={product}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-accent-gold/20 to-accent-electric/20 border border-accent-gold/30 text-white"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Результат для режима "одно блюдо" */}
      {generationMode === 'single_dish' && generatedSingleDish && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{generatedSingleDish.name}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedMeal(generatedSingleDish)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg transition-all text-sm"
                >
                  Подробнее
                </button>
                <button
                  onClick={() => downloadSingleDishPDF(generatedSingleDish)}
                  disabled={downloading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-medium hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                      <span>PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {generatedSingleDish.description && (
              <p className="text-white/70 mb-4">{generatedSingleDish.description}</p>
            )}
            <div className="flex items-center flex-wrap gap-4 mb-4 p-4 rounded-xl bg-white/5">
              <span className="text-white/60">Калории: <span className="text-white font-semibold">{generatedSingleDish.calories} ккал</span></span>
              <span className="text-yellow-400">Жиры: <span className="font-semibold">{generatedSingleDish.fats}г</span></span>
              <span className="text-blue-400">Белки: <span className="font-semibold">{generatedSingleDish.proteins}г</span></span>
              <span className="text-green-400">Углеводы: <span className="font-semibold">{generatedSingleDish.carbs}г</span></span>
              <span className="text-white/60">Время: <span className="text-white font-semibold">{generatedSingleDish.prepTime} мин</span></span>
            </div>
            {generatedSingleDish.ingredients && generatedSingleDish.ingredients.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Ингредиенты:</h4>
                <ul className="list-disc list-inside text-white/70 space-y-1">
                  {generatedSingleDish.ingredients.map((ingredient, idx) => (
                    <li key={idx}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Результат для нескольких блюд */}
      {generationMode === 'single_dish' && generatedDishes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 mb-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Найденные блюда ({generatedDishes.length}):</h3>
          {generatedDishes.map((dish, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-bold text-white">{dish.name}</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedMeal(dish)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg transition-all text-sm"
                  >
                    Подробнее
                  </button>
                  <button
                    onClick={() => downloadSingleDishPDF(dish)}
                    disabled={downloading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-medium hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                        <span>PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {dish.description && (
                <p className="text-white/70 mb-4 text-sm">{dish.description}</p>
              )}
              <div className="flex items-center flex-wrap gap-4 mb-4 p-4 rounded-xl bg-white/5">
                <span className="text-white/60 text-sm">Калории: <span className="text-white font-semibold">{dish.calories} ккал</span></span>
                <span className="text-yellow-400 text-sm">Жиры: <span className="font-semibold">{dish.fats}г</span></span>
                <span className="text-blue-400 text-sm">Белки: <span className="font-semibold">{dish.proteins}г</span></span>
                <span className="text-green-400 text-sm">Углеводы: <span className="font-semibold">{dish.carbs}г</span></span>
                <span className="text-white/60 text-sm">Время: <span className="text-white font-semibold">{dish.prepTime} мин</span></span>
              </div>
              {dish.ingredients && dish.ingredients.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-white font-semibold mb-2 text-sm">Ингредиенты:</h5>
                  <ul className="list-disc list-inside text-white/70 space-y-1 text-sm">
                    {dish.ingredients.slice(0, 5).map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                    {dish.ingredients.length > 5 && (
                      <li className="text-white/50">... и еще {dish.ingredients.length - 5}</li>
                    )}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

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
                  <UtensilsCrossed className="w-5 h-5 text-accent-gold" />
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

                {/* Дополнения (snack и dessert) только для полного меню */}
                {(day.snack || day.dessert) && (
                  <div className="mb-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/60 font-medium">Дополнения:</div>
                      <div className="text-xs text-white/40 italic">* Не корректируются под целевые калории</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {day.snack && (
                        <div className="relative group">
                          <MealCard meal={day.snack} label="Перекус" onImageClick={() => setSelectedMeal(day.snack!)} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSnackOrDessert(index, 'snack')
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all z-20 shadow-lg hover:shadow-red-500/50 border-2 border-white/30"
                            title="Удалить перекус"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {day.dessert && (
                        <div className="relative group">
                          <MealCard meal={day.dessert} label="Десерт" onImageClick={() => setSelectedMeal(day.dessert!)} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSnackOrDessert(index, 'dessert')
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all z-20 shadow-lg hover:shadow-red-500/50 border-2 border-white/30"
                            title="Удалить десерт"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  {/* Основные блюда (целевые калории) */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <span className="text-white/60 font-medium">Основные блюда (завтрак, обед, ужин):</span>
                    <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                      <span className="text-white font-semibold whitespace-nowrap">{parseInt(targetCalories)} ккал</span>
                      <span className="text-yellow-400 whitespace-nowrap">{totals.mainMeals.fats}г жиров</span>
                      <span className="text-blue-400 whitespace-nowrap">{totals.mainMeals.proteins}г белков</span>
                      <span className="text-green-400 whitespace-nowrap">{totals.mainMeals.carbs}г углеводов</span>
                    </div>
                  </div>
                  
                  {/* Всего с дополнениями */}
                  {(day.snack || day.dessert) && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-2 border-t border-white/5">
                      <span className="text-white/60 font-medium">Всего за день (с дополнениями):</span>
                      <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                        <span className="text-white font-semibold whitespace-nowrap">{totals.total.calories} ккал</span>
                        <span className="text-yellow-400 whitespace-nowrap">{totals.total.fats}г жиров</span>
                        <span className="text-blue-400 whitespace-nowrap">{totals.total.proteins}г белков</span>
                        <span className="text-green-400 whitespace-nowrap">{totals.total.carbs}г углеводов</span>
                      </div>
                    </div>
                  )}
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

// Функция для перевода способа приготовления в читаемый текст
function getProcessingMethodLabel(method?: ProcessingMethod): string {
  if (!method) return ''
  const labels: Record<ProcessingMethod, string> = {
    sous_vide: 'Су-вид',
    frying: 'Жарка',
    baking: 'Запекание',
    boiling: 'Варка',
    steaming: 'На пару',
    grilling: 'Гриль',
    air_frying: 'Аэрогриль'
  }
  return labels[method] || ''
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
      {meal.processingMethod && (
        <div className="mt-2 text-xs text-white/50">
          <span className="text-white/40">Способ:</span> {getProcessingMethodLabel(meal.processingMethod)}
        </div>
      )}
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
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 pb-4 px-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full max-h-[calc(100vh-6rem)] my-auto overflow-y-auto rounded-2xl bg-gradient-to-br from-dark-800 via-dark-800/95 to-dark-900 border-2 border-white/10 shadow-2xl"
      >
        {/* Кнопка закрытия - sticky, всегда видна */}
        <div className="sticky top-0 z-50 flex justify-end p-4 bg-gradient-to-b from-dark-800 via-dark-800/95 to-transparent rounded-t-2xl">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-red-500/50 border-2 border-white/30 backdrop-blur-sm"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="text-2xl font-bold text-white flex-1">{meal.name}</h3>
            {meal.estimatedCost && (
              <div className="flex-shrink-0 px-4 py-2 rounded-full bg-gradient-to-r from-accent-gold/20 to-amber-400/20 border border-accent-gold/40 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-accent-gold text-lg font-bold">💰</span>
                  <span className="text-accent-gold font-bold text-base">{Math.round(meal.estimatedCost * 0.85)}</span>
                  <span className="text-accent-gold/80 text-sm">₽</span>
                </div>
                <div className="text-xs text-accent-gold/60 text-center mt-0.5">примерная стоимость</div>
                {meal.processingMethod && (
                  <div className="text-xs text-accent-gold/70 text-center mt-1.5 pt-1.5 border-t border-accent-gold/20">
                    {getProcessingMethodLabel(meal.processingMethod)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Описание блюда */}
          {meal.description && (
            <div className="mb-6">
              <p className="text-white/80 text-lg leading-relaxed italic">
                {meal.description}
              </p>
            </div>
          )}

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
            {meal.processingMethod && (
              <div className="flex items-center gap-2">
                <span className="text-white/60">Способ:</span>
                <span className="text-accent-gold font-semibold">{getProcessingMethodLabel(meal.processingMethod)}</span>
              </div>
            )}
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
                Инструкции по приготовлению:
                {meal.processingMethod && (
                  <span className="ml-2 text-sm text-accent-gold font-normal">
                    ({getProcessingMethodLabel(meal.processingMethod)})
                  </span>
                )}
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

