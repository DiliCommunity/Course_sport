'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Loader2, ChefHat, ArrowLeft, Clock, Flame, Beef, Salad, Search, X, Sparkles, UtensilsCrossed, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { enhancedMealsDatabase } from '@/components/recipes/enhancedMealsData'
import { MenuGenerator } from '@/components/recipes/MenuGenerator'
import type { Meal, ProcessingMethod, DishType } from '@/components/recipes/MenuGenerator'
import { getMealImage } from '@/components/recipes/mealImageMapping'

// Способы приготовления с названиями и изображениями
const COOKING_METHODS: { id: ProcessingMethod | 'all'; name: string; description: string; image: string }[] = [
  { id: 'all', name: 'Все способы', description: 'Показать все блюда', image: '/img/cooking-methods/all-methods.jpg' },
  { id: 'sous_vide', name: 'Су-вид', description: 'При низкой температуре в вакууме', image: '/img/cooking-methods/sous_vide.jpg' },
  { id: 'grilling', name: 'Гриль', description: 'На открытом огне или гриле', image: '/img/cooking-methods/grilling.jpg' },
  { id: 'frying', name: 'Жарка', description: 'На сковороде со сливочным маслом', image: '/img/cooking-methods/frying.jpg' },
  { id: 'baking', name: 'Запекание', description: 'В духовке', image: '/img/cooking-methods/baking.jpg' },
  { id: 'boiling', name: 'Варка', description: 'В воде или бульоне', image: '/img/cooking-methods/boiling.jpg' },
  { id: 'steaming', name: 'На пару', description: 'Приготовление на пару', image: '/img/cooking-methods/steaming.jpg' },
  { id: 'air_frying', name: 'Аэрогриль', description: 'В аэрогриле', image: '/img/cooking-methods/air-frying.jpg' },
]

// Типы блюд с названиями и изображениями
const MEAL_TYPES: { id: DishType | 'all' | 'salad'; name: string; description: string; image: string }[] = [
  { id: 'all', name: 'Все блюда', description: 'Показать все блюда', image: '/img/meal-types/all-dishes.jpg' },
  { id: 'salad', name: 'Салаты', description: 'Свежие и сытные салаты', image: '/img/meal-types/salads.jpg' },
  { id: 'snack', name: 'Закуски', description: 'Лёгкие закуски и снеки', image: '/img/meal-types/snacks.jpg' },
  { id: 'first', name: 'Первые блюда', description: 'Супы и бульоны', image: '/img/meal-types/soups.jpg' },
  { id: 'second', name: 'Вторые блюда', description: 'Основные горячие блюда', image: '/img/meal-types/main-courses.jpg' },
  { id: 'dessert', name: 'Десерты', description: 'Кето-десерты и сладости', image: '/img/meal-types/desserts.jpg' },
]

export default function RecipesPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  
  // Режим страницы: recipes - просмотр рецептов, generator - генератор меню
  const [mode, setMode] = useState<'recipes' | 'generator'>('recipes')
  
  // Состояние навигации для рецептов
  const [step, setStep] = useState<'cooking_method' | 'meal_type' | 'recipes'>('cooking_method')
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<ProcessingMethod | 'all'>('all')
  const [selectedMealType, setSelectedMealType] = useState<DishType | 'all' | 'salad'>('all')
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Функция скачивания PDF для рецепта (красивый HTML-шаблон с тёмной темой)
  const downloadRecipePDF = async (recipe: Meal) => {
    if (downloadingPdf) return
    setDownloadingPdf(true)

    try {
      // Получаем метки для способа приготовления и типа блюда
      const getProcessingMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
          'sous_vide': 'Су-вид',
          'grilling': 'Гриль',
          'frying': 'Жарка',
          'baking': 'Запекание',
          'boiling': 'Варка',
          'steaming': 'На пару'
        }
        return labels[method] || method
      }
      
      const processingMethodLabel = recipe.processingMethod ? getProcessingMethodLabel(recipe.processingMethod) : ''
      const dishTypeLabel = recipe.dishType === 'first' ? 'Первое блюдо' : recipe.dishType === 'second' ? 'Второе блюдо' : recipe.dishType === 'dessert' ? 'Десерт' : recipe.dishType === 'snack' ? 'Закуска' : ''

      // Создаем красивый HTML элемент с темными стилями
      const printContent = document.createElement('div')
      printContent.id = 'recipe-pdf-content'
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '50px'
      printContent.style.background = 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0a0a0b 100%)'
      printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      printContent.style.color = '#ffffff'
      printContent.style.borderRadius = '20px'

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
            ${recipe.name}
          </h1>
          
          <p style="
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            font-size: 16px;
            margin: 0 0 40px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">
            CourseHealth - Рецепты
          </p>
          
          ${recipe.description ? `
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
              ${recipe.description}
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
                <div style="font-size: 20px; font-weight: bold; color: #ffd700;">${recipe.prepTime} мин</div>
              </div>
              <div style="
                background: rgba(16, 185, 129, 0.15);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
              ">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">🔥 Калории</div>
                <div style="font-size: 20px; font-weight: bold; color: #10b981;">${recipe.calories} ккал</div>
              </div>
              <div style="
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
              ">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px;">💰 Стоимость</div>
                <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${recipe.estimatedCost || '—'} ₽</div>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; text-align: center;">
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Белки</div>
                  <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${recipe.proteins}г</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Жиры</div>
                  <div style="font-size: 18px; font-weight: bold; color: #ffd700;">${recipe.fats}г</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Углеводы</div>
                  <div style="font-size: 18px; font-weight: bold; color: #10b981;">${recipe.carbs}г</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Способ</div>
                  <div style="font-size: 14px; font-weight: bold; color: rgba(255, 255, 255, 0.9);">${processingMethodLabel || dishTypeLabel || '—'}</div>
                </div>
              </div>
            </div>
          </div>
          
          ${recipe.ingredients && recipe.ingredients.length > 0 ? `
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
                ${recipe.ingredients.map((ingredient, idx) => `
                  <li style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 15px;
                    padding: 8px 0;
                    border-bottom: ${idx < recipe.ingredients!.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'};
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
          
          ${recipe.instructions && recipe.instructions.length > 0 ? `
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
              Приготовление:
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
                ${recipe.instructions.map((step, idx) => `
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
          
          <!-- Футер -->
          <div style="
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          ">
            <p style="
              color: rgba(255, 255, 255, 0.5);
              font-size: 14px;
              margin: 0;
            ">
              🌐 coursehealth.ru | 💚 CourseHealth
            </p>
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

      const fileName = `${recipe.name.replace(/\s+/g, '_')}.pdf`
      
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

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  useEffect(() => {
    const checkAccess = async () => {
      // Если пользователь админ - сразу даём доступ
      if (user?.is_admin) {
        console.log('[RecipesPage] User is admin - full access granted')
        setHasAccess(true)
        setIsChecking(false)
        return
      }

      try {
        const response = await fetch('/api/courses/access?check_purchased=true', {
          credentials: 'include'
        })
        const data = await response.json()
        // Админ или купил курс
        setHasAccess(data.hasPurchased === true || data.isAdmin === true)
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setIsChecking(false)
      }
    }
    checkAccess()
  }, [user])

  // Собираем все рецепты из enhancedMealsDatabase
  const allRecipes = useMemo(() => {
    const recipes: Meal[] = []
    const seenNames = new Set<string>()
    
    // Собираем все массивы рецептов
    Object.values(enhancedMealsDatabase).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(meal => {
          // Убираем дубликаты по названию
          if (!seenNames.has(meal.name)) {
            seenNames.add(meal.name)
            // Добавляем изображение из маппинга если его нет
            const image = meal.image || getMealImage(meal.name)
            recipes.push({ ...meal, image })
          }
        })
      }
    })
    
    return recipes
  }, [])

  // Фильтрация рецептов
  const filteredRecipes = useMemo(() => {
    let result = allRecipes
    
    // Фильтр по способу приготовления
    if (selectedCookingMethod !== 'all') {
      result = result.filter(meal => meal.processingMethod === selectedCookingMethod)
    }
    
    // Фильтр по типу блюда
    if (selectedMealType !== 'all') {
      if (selectedMealType === 'salad') {
        // Салаты - это блюда с названием "Салат" или холодные вторые блюда
        result = result.filter(meal => 
          meal.name.toLowerCase().includes('салат') || 
          (meal.cookingMethod === 'cold' && meal.dishType === 'second')
        )
      } else {
        result = result.filter(meal => meal.dishType === selectedMealType)
      }
    }
    
    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(meal => 
        meal.name.toLowerCase().includes(query) ||
        meal.description?.toLowerCase().includes(query) ||
        meal.ingredients?.some(ing => ing.toLowerCase().includes(query))
      )
    }
    
    return result
  }, [allRecipes, selectedCookingMethod, selectedMealType, searchQuery])

  // Подсчёт рецептов для каждого типа
  const getCountForMethod = (method: ProcessingMethod | 'all') => {
    if (method === 'all') return allRecipes.length
    return allRecipes.filter(m => m.processingMethod === method).length
  }

  const getCountForMealType = (type: DishType | 'all' | 'salad') => {
    let recipes = selectedCookingMethod === 'all' 
      ? allRecipes 
      : allRecipes.filter(m => m.processingMethod === selectedCookingMethod)
    
    if (type === 'all') return recipes.length
    // Салаты - это холодные блюда с названием, содержащим "Салат" или "салат"
    if (type === 'salad') {
      return recipes.filter(m => 
        m.name.toLowerCase().includes('салат') || 
        (m.cookingMethod === 'cold' && m.dishType === 'second')
      ).length
    }
    return recipes.filter(m => m.dishType === type).length
  }

  // Обработка выбора способа приготовления
  const handleCookingMethodSelect = (method: ProcessingMethod | 'all') => {
    setSelectedCookingMethod(method)
    setStep('meal_type')
  }

  // Обработка выбора типа блюда
  const handleMealTypeSelect = (type: DishType | 'all' | 'salad') => {
    setSelectedMealType(type)
    setStep('recipes')
  }

  // Назад
  const handleBack = () => {
    if (step === 'recipes') {
      setStep('meal_type')
      setSearchQuery('')
    } else if (step === 'meal_type') {
      setStep('cooking_method')
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent-mint mx-auto mb-4" />
          <p className="text-white/60">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 rounded-2xl bg-gradient-to-br from-dark-800/90 via-dark-800/50 to-dark-900/90 border-2 border-white/10 backdrop-blur-xl shadow-2xl text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-mint/20 to-accent-teal/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-accent-mint" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Доступ ограничен</h1>
          <p className="text-white/70 mb-6">
            Личный шеф доступен только для пользователей, которые оплатили хотя бы один курс.
          </p>
          <Button
            onClick={() => router.push('/courses')}
            variant="primary"
            size="lg"
          >
            Посмотреть курсы
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-dark-900" />
            </div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-accent-gold via-accent-electric to-accent-gold bg-clip-text text-transparent">
                Личный шеф
              </span>
            </h1>
          </div>
          <p className="text-white/60 text-lg">
            {mode === 'generator' 
              ? 'Создайте персональное меню на основе ваших предпочтений'
              : step === 'cooking_method' 
                ? 'Выберите способ приготовления' 
                : step === 'meal_type' 
                  ? 'Выберите тип блюда' 
                  : `${filteredRecipes.length} рецептов`
            }
          </p>
        </motion.div>

        {/* Кнопки переключения режима */}
        {mode === 'recipes' && step === 'cooking_method' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <button
              onClick={() => setMode('generator')}
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-bold text-lg flex items-center gap-3 shadow-[0_0_25px_rgba(255,215,0,0.4),0_0_50px_rgba(0,217,255,0.2)] hover:shadow-[0_0_40px_rgba(255,215,0,0.6),0_0_80px_rgba(0,217,255,0.4)] hover:scale-105 transition-all duration-300 border-2 border-accent-gold/50"
            >
              <Sparkles className="w-6 h-6" />
              <span>Сгенерировать меню</span>
              <UtensilsCrossed className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Режим генератора меню */}
        {mode === 'generator' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => setMode('recipes')}
              className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>К рецептам</span>
            </button>
            <MenuGenerator />
          </motion.div>
        )}

        {/* Режим просмотра рецептов */}
        {mode === 'recipes' && (
          <>
            {/* Кнопка назад */}
            {step !== 'cooking_method' && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </motion.button>
        )}

        {/* Шаг 1: Выбор способа приготовления */}
        <AnimatePresence mode="wait">
          {step === 'cooking_method' && (
            <motion.div
              key="cooking_method"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {COOKING_METHODS
                .filter(method => method.id === 'all' || getCountForMethod(method.id) > 0)
                .map((method, index) => {
                const count = getCountForMethod(method.id)
                return (
                  <motion.button
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                    whileHover={{ scale: 1.03, y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCookingMethodSelect(method.id)}
                    className="relative h-48 md:h-56 rounded-2xl border-2 transition-all duration-300 text-left group overflow-hidden border-white/20 hover:border-accent-gold/70 hover:shadow-2xl hover:shadow-accent-gold/30"
                  >
                    {/* Фоновое фото на всю кнопку */}
                    <div className="absolute inset-0">
                      <Image
                        src={method.image}
                        alt={method.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      {/* Тёмный градиент для читаемости текста */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-black/95 group-hover:via-black/60 transition-all duration-300" />
                    </div>
                    
                    {/* Контент поверх фото */}
                    <div className="relative h-full flex flex-col justify-end p-5 z-10">
                      {/* Переливающийся заголовок */}
                      <h3 className="text-2xl font-bold mb-1 text-neon-shine drop-shadow-lg">
                        {method.name}
                      </h3>
                      <p className="text-sm text-white/80 mb-3 drop-shadow-md">{method.description}</p>
                      
                      {/* Счётчик блюд с подсветкой */}
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-accent-gold/50 badge-glow w-fit">
                        <span className="text-base font-bold text-gradient-shine">
                          {count} блюд
                        </span>
                      </div>
                    </div>

                    {/* Свечение при наведении */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/0 via-accent-gold/10 to-accent-mint/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-5" />
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {/* Шаг 2: Выбор типа блюда */}
          {step === 'meal_type' && (
            <motion.div
              key="meal_type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Показываем выбранный способ */}
              <div className="mb-6 p-4 rounded-xl bg-dark-800/50 border border-white/10">
                <span className="text-white/50">Способ приготовления: </span>
                <span className="text-accent-gold font-medium">
                  {COOKING_METHODS.find(m => m.id === selectedCookingMethod)?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {MEAL_TYPES
                  .filter(type => type.id === 'all' || getCountForMealType(type.id) > 0)
                  .map((type, index) => {
                  const count = getCountForMealType(type.id)
                  return (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMealTypeSelect(type.id)}
                      className="relative h-44 rounded-2xl border-2 transition-all duration-300 text-center group overflow-hidden border-white/10 hover:border-accent-mint/60 hover:shadow-xl hover:shadow-accent-mint/20"
                    >
                      {/* Фоновое изображение */}
                      <Image
                        src={type.image}
                        alt={type.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                      {/* Тёмный градиент для читаемости текста */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-black/95 group-hover:via-black/60 transition-all duration-300" />
                      
                      {/* Контент поверх изображения */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4">
                        <h3 className="text-lg font-bold text-neon-shine mb-1 drop-shadow-lg">{type.name}</h3>
                        <p className="text-xs text-white/70 mb-2 line-clamp-1">{type.description}</p>
                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-accent-mint/20 border border-accent-mint/50 backdrop-blur-sm">
                          <span className="text-sm font-bold bg-gradient-to-r from-accent-mint via-white to-accent-aqua bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                            {count} блюд
                          </span>
                        </div>
                      </div>
                      
                      {/* Декоративное свечение при наведении */}
                      <div className="absolute inset-0 bg-gradient-to-br from-accent-mint/0 via-accent-mint/10 to-accent-aqua/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Шаг 3: Список рецептов */}
          {step === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Фильтры */}
              <div className="mb-6 p-4 rounded-xl bg-dark-800/50 border border-white/10 flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-white/50">Способ: </span>
                  <span className="text-accent-gold font-medium">
                    {COOKING_METHODS.find(m => m.id === selectedCookingMethod)?.name}
                  </span>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div>
                  <span className="text-white/50">Тип: </span>
                  <span className="text-accent-mint font-medium">
                    {MEAL_TYPES.find(t => t.id === selectedMealType)?.name}
                  </span>
                </div>
                <div className="flex-1" />
                {/* Поиск */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск рецептов..."
                    className="pl-10 pr-10 py-2 rounded-lg bg-dark-700 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-gold/50 w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Сетка рецептов */}
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/50 text-lg">Рецепты не найдены</p>
                  <p className="text-white/30 mt-2">Попробуйте изменить фильтры</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.name + index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index * 0.03, 0.5) } }}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="rounded-2xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-dark-800/90 to-dark-900/90 cursor-pointer hover:border-accent-gold/50 hover:shadow-xl hover:shadow-accent-gold/10 transition-all duration-300 group"
                    >
                      {/* Изображение */}
                      <div className="relative h-48 overflow-hidden">
                        {recipe.image ? (
                          <Image
                            src={recipe.image}
                            alt={recipe.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent-gold/20 to-accent-electric/20 flex items-center justify-center">
                            <ChefHat className="w-16 h-16 text-white/30" />
                          </div>
                        )}
                        {/* Бейдж способа приготовления */}
                        {recipe.processingMethod && (
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm text-sm text-accent-gold font-medium">
                            {COOKING_METHODS.find(m => m.id === recipe.processingMethod)?.name}
                          </div>
                        )}
                      </div>
                      
                      {/* Контент */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{recipe.name}</h3>
                        <p className="text-sm text-white/50 mb-4 line-clamp-2">{recipe.description}</p>
                        
                        {/* Характеристики */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-white/60">
                            <Clock className="w-4 h-4" />
                            <span>{recipe.prepTime} мин</span>
                          </div>
                          <div className="flex items-center gap-1 text-accent-gold">
                            <Flame className="w-4 h-4" />
                            <span>{recipe.calories} ккал</span>
                          </div>
                          <div className="flex items-center gap-1 text-accent-mint">
                            <Beef className="w-4 h-4" />
                            <span>{recipe.proteins}г</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно с деталями рецепта */}
        <AnimatePresence>
          {selectedRecipe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecipe(null)}
              className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 pb-4 px-4 bg-dark-900/80 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[calc(100vh-6rem)] my-auto overflow-y-auto rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-white/10 shadow-2xl"
              >
                {/* Кнопка закрытия - sticky, всегда видна */}
                <div className="sticky top-0 z-50 flex justify-end p-4 bg-gradient-to-b from-dark-800 via-dark-800/95 to-transparent rounded-t-2xl">
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/90 hover:bg-red-600 text-white transition-all shadow-lg hover:shadow-red-500/50 border-2 border-white/30 backdrop-blur-sm"
                    aria-label="Закрыть"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Изображение */}
                <div className="relative h-64 md:h-80">
                  {selectedRecipe.image ? (
                    <Image
                      src={selectedRecipe.image}
                      alt={selectedRecipe.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent-gold/20 to-accent-electric/20 flex items-center justify-center">
                      <ChefHat className="w-24 h-24 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
                </div>

                {/* Контент */}
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-white flex-1">{selectedRecipe.name}</h2>
                    <button
                      onClick={() => downloadRecipePDF(selectedRecipe)}
                      disabled={downloadingPdf}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-mint to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-mint/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingPdf ? (
                        <>
                          <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Скачать PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Характеристики */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50">
                      <Clock className="w-5 h-5 text-accent-gold" />
                      <span className="text-white">{selectedRecipe.prepTime} мин</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50">
                      <Flame className="w-5 h-5 text-accent-gold" />
                      <span className="text-white">{selectedRecipe.calories} ккал</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50">
                      <Beef className="w-5 h-5 text-accent-mint" />
                      <span className="text-white">Б: {selectedRecipe.proteins}г</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50">
                      <Salad className="w-5 h-5 text-green-400" />
                      <span className="text-white">Ж: {selectedRecipe.fats}г</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50">
                      <span className="text-white">У: {selectedRecipe.carbs}г</span>
                    </div>
                    {selectedRecipe.estimatedCost && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50">
                        <span className="text-accent-gold">~{selectedRecipe.estimatedCost}₽</span>
                      </div>
                    )}
                  </div>

                  {/* Описание */}
                  {selectedRecipe.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-2">Описание</h3>
                      <p className="text-white/70 leading-relaxed">{selectedRecipe.description}</p>
                    </div>
                  )}

                  {/* Ингредиенты */}
                  {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Ингредиенты</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedRecipe.ingredients.map((ingredient, i) => (
                          <li key={i} className="flex items-center gap-2 text-white/70">
                            <span className="w-2 h-2 rounded-full bg-accent-gold" />
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Инструкции */}
                  {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Приготовление</h3>
                      <ol className="space-y-3">
                        {selectedRecipe.instructions.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center text-sm font-bold text-dark-900">
                              {i + 1}
                            </span>
                            <span className="text-white/70 pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
