'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Loader2, ChefHat, ArrowLeft, Clock, Flame, Beef, Salad, Search, X, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { enhancedMealsDatabase } from '@/components/recipes/enhancedMealsData'
import { MenuGenerator } from '@/components/recipes/MenuGenerator'
import type { Meal, ProcessingMethod, DishType } from '@/components/recipes/MenuGenerator'
import { getMealImage } from '@/components/recipes/mealImageMapping'

// Способы приготовления с названиями и иконками
const COOKING_METHODS: { id: ProcessingMethod | 'all'; name: string; description: string; icon: string }[] = [
  { id: 'all', name: 'Все способы', description: 'Показать все блюда', icon: '🍽️' },
  { id: 'sous_vide', name: 'Су-вид', description: 'Приготовление при низкой температуре в вакууме', icon: '🥩' },
  { id: 'grilling', name: 'Гриль', description: 'Приготовление на открытом огне или гриле', icon: '🔥' },
  { id: 'frying', name: 'Жарка', description: 'Жарка на сковороде или во фритюре', icon: '🍳' },
  { id: 'baking', name: 'Запекание', description: 'Запекание в духовке', icon: '♨️' },
  { id: 'boiling', name: 'Варка', description: 'Варка в воде или бульоне', icon: '🍲' },
  { id: 'steaming', name: 'На пару', description: 'Приготовление на пару', icon: '💨' },
  { id: 'air_frying', name: 'Аэрогриль', description: 'Приготовление в аэрогриле', icon: '🌀' },
]

// Приёмы пищи с названиями
const MEAL_TYPES: { id: DishType | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: 'Все блюда', icon: '🍽️' },
  { id: 'snack', name: 'Закуски', icon: '🥗' },
  { id: 'first', name: 'Первые блюда', icon: '🍜' },
  { id: 'second', name: 'Вторые блюда', icon: '🥘' },
  { id: 'dessert', name: 'Десерты', icon: '🍰' },
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
  const [selectedMealType, setSelectedMealType] = useState<DishType | 'all'>('all')
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/courses/access?check_purchased=true', {
          credentials: 'include'
        })
        const data = await response.json()
        setHasAccess(data.hasPurchased || false)
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
      result = result.filter(meal => meal.dishType === selectedMealType)
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

  const getCountForMealType = (type: DishType | 'all') => {
    let recipes = selectedCookingMethod === 'all' 
      ? allRecipes 
      : allRecipes.filter(m => m.processingMethod === selectedCookingMethod)
    
    if (type === 'all') return recipes.length
    return recipes.filter(m => m.dishType === type).length
  }

  // Обработка выбора способа приготовления
  const handleCookingMethodSelect = (method: ProcessingMethod | 'all') => {
    setSelectedCookingMethod(method)
    setStep('meal_type')
  }

  // Обработка выбора типа блюда
  const handleMealTypeSelect = (type: DishType | 'all') => {
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
              {COOKING_METHODS.map((method, index) => {
                const count = getCountForMethod(method.id)
                return (
                  <motion.button
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                    onClick={() => handleCookingMethodSelect(method.id)}
                    disabled={count === 0 && method.id !== 'all'}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                      ${count === 0 && method.id !== 'all'
                        ? 'border-white/5 bg-dark-800/30 cursor-not-allowed opacity-50'
                        : 'border-white/10 bg-gradient-to-br from-dark-800/90 to-dark-900/90 hover:border-accent-gold/50 hover:shadow-lg hover:shadow-accent-gold/10'
                      }`}
                  >
                    {/* Иконка способа (заглушка - замените на реальное фото) */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-electric/20 flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform">
                      {method.icon}
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1">{method.name}</h3>
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{method.description}</p>
                    
                    <div className="flex items-center gap-2 text-accent-gold">
                      <span className="text-sm font-medium">{count} блюд</span>
                    </div>
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {MEAL_TYPES.map((type, index) => {
                  const count = getCountForMealType(type.id)
                  return (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                      onClick={() => handleMealTypeSelect(type.id)}
                      disabled={count === 0 && type.id !== 'all'}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-center group
                        ${count === 0 && type.id !== 'all'
                          ? 'border-white/5 bg-dark-800/30 cursor-not-allowed opacity-50'
                          : 'border-white/10 bg-gradient-to-br from-dark-800/90 to-dark-900/90 hover:border-accent-mint/50 hover:shadow-lg hover:shadow-accent-mint/10'
                        }`}
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{type.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-2">{type.name}</h3>
                      <div className="text-accent-mint font-medium">{count} блюд</div>
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
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-dark-900/80 backdrop-blur-sm text-sm text-accent-gold">
                            {COOKING_METHODS.find(m => m.id === recipe.processingMethod)?.icon}{' '}
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-white/10 shadow-2xl"
              >
                {/* Кнопка закрытия */}
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-dark-900/80 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

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
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{selectedRecipe.name}</h2>
                  
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
