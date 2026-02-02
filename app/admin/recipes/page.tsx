'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  ChefHat, Loader2, Plus, X, Upload, Image as ImageIcon,
  Clock, Flame, UtensilsCrossed, FileText, Save, ArrowLeft, Menu
} from 'lucide-react'
import Link from 'next/link'
import type { Meal, ProcessingMethod, DishType, CookingMethod } from '@/components/recipes/MenuGenerator'

interface Recipe extends Meal {
  id?: string
  image_url?: string
}

const COOKING_METHODS: ProcessingMethod[] = ['sous_vide', 'grilling', 'frying', 'baking', 'boiling', 'steaming', 'air_frying']
const DISH_TYPES: DishType[] = ['snack', 'first', 'second', 'dessert']
const COOKING_TYPES: CookingMethod[] = ['cold', 'hot']

const COOKING_METHOD_LABELS: Record<ProcessingMethod, string> = {
  sous_vide: 'Су-вид',
  grilling: 'Гриль',
  frying: 'Жарка',
  baking: 'Запекание',
  boiling: 'Варка',
  steaming: 'На пару',
  air_frying: 'Аэрогриль'
}

const DISH_TYPE_LABELS: Record<DishType, string> = {
  snack: 'Закуска',
  first: 'Первое блюдо',
  second: 'Второе блюдо',
  dessert: 'Десерт'
}

const COOKING_TYPE_LABELS: Record<CookingMethod, string> = {
  cold: 'Холодное',
  hot: 'Горячее'
}

export default function AdminRecipesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    description: '',
    calories: 0,
    proteins: 0,
    fats: 0,
    carbs: 0,
    prepTime: 0,
    estimatedCost: 0,
    cookingMethod: 'hot',
    dishType: 'second',
    processingMethod: 'baking',
    ingredients: [],
    instructions: [],
    availableProducts: []
  })

  const [ingredientInput, setIngredientInput] = useState('')
  const [instructionInput, setInstructionInput] = useState('')
  const [productInput, setProductInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.is_admin) {
      router.push('/')
      return
    }

    fetchRecipes()
  }, [user, authLoading, router])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/recipes', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить рецепты')
      }
      
      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (err) {
      console.error('Error fetching recipes:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 5 МБ')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData({
        ...formData,
        ingredients: [...(formData.ingredients || []), ingredientInput.trim()]
      })
      setIngredientInput('')
    }
  }

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients?.filter((_, i) => i !== index) || []
    })
  }

  const addInstruction = () => {
    if (instructionInput.trim()) {
      setFormData({
        ...formData,
        instructions: [...(formData.instructions || []), instructionInput.trim()]
      })
      setInstructionInput('')
    }
  }

  const removeInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions?.filter((_, i) => i !== index) || []
    })
  }

  const addProduct = () => {
    if (productInput.trim()) {
      setFormData({
        ...formData,
        availableProducts: [...(formData.availableProducts || []), productInput.trim()]
      })
      setProductInput('')
    }
  }

  const removeProduct = (index: number) => {
    setFormData({
      ...formData,
      availableProducts: formData.availableProducts?.filter((_, i) => i !== index) || []
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formDataToSend = new FormData()
      
      // Добавляем все поля формы
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof Recipe]
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value))
          } else {
            formDataToSend.append(key, String(value))
          }
        }
      })

      // Добавляем изображение, если есть
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      const response = await fetch('/api/admin/recipes', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения рецепта')
      }

      setSuccess('Рецепт успешно добавлен!')
      setIsModalOpen(false)
      resetForm()
      fetchRecipes()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      calories: 0,
      proteins: 0,
      fats: 0,
      carbs: 0,
      prepTime: 0,
      estimatedCost: 0,
      cookingMethod: 'hot',
      dishType: 'second',
      processingMethod: 'baking',
      ingredients: [],
      instructions: [],
      availableProducts: []
    })
    setImageFile(null)
    setImagePreview(null)
    setIngredientInput('')
    setInstructionInput('')
    setProductInput('')
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-electric animate-spin" />
      </main>
    )
  }

  if (!user?.is_admin) {
    return null
  }

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition-all mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в админ-панель
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Управление рецептами
            </h1>
          </div>
          <p className="text-white/60 mb-6">
            Добавляйте и редактируйте рецепты для пользователей
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/recipes"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
            >
              <Menu className="w-5 h-5" />
              Меню личного шефа
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all"
            >
              <Plus className="w-5 h-5" />
              Добавить рецепт
            </button>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400"
          >
            {success}
          </motion.div>
        )}

        {/* Recipes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <motion.div
              key={recipe.id || recipe.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl glass border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              {recipe.image_url && (
                <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-white/5">
                  <img 
                    src={recipe.image_url} 
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{recipe.name}</h3>
              {recipe.description && (
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{recipe.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.prepTime} мин
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {recipe.calories} ккал
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Recipe Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 pb-4 px-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="absolute inset-0 bg-dark-900/90 backdrop-blur-md"
                style={{ zIndex: 9998 }}
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl glass border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                style={{ zIndex: 9999 }}
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-red-500/10 rounded-2xl" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="sticky top-0 z-50 flex items-center justify-between p-6 border-b border-white/10 bg-dark-800/95 backdrop-blur-sm rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ChefHat className="w-6 h-6 text-rose-400" />
                      Добавить новый рецепт
                    </h2>
                    <button
                      onClick={() => {
                        setIsModalOpen(false)
                        resetForm()
                      }}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/40 flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5 text-white/80 hover:text-white" />
                    </button>
                  </div>
                  
                  <div className="p-6">

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Название блюда *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                        placeholder="Например: Куриная грудка с овощами"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Время приготовления (мин) *
                      </label>
                      <input
                        type="number"
                        value={formData.prepTime}
                        onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
                        required
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Описание
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all resize-none"
                      placeholder="Подробное описание блюда..."
                    />
                  </div>

                  {/* Nutritional Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Калории *
                      </label>
                      <input
                        type="number"
                        value={formData.calories}
                        onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                        required
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Белки (г) *
                      </label>
                      <input
                        type="number"
                        value={formData.proteins}
                        onChange={(e) => setFormData({ ...formData, proteins: parseFloat(e.target.value) || 0 })}
                        required
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Жиры (г) *
                      </label>
                      <input
                        type="number"
                        value={formData.fats}
                        onChange={(e) => setFormData({ ...formData, fats: parseFloat(e.target.value) || 0 })}
                        required
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Углеводы (г) *
                      </label>
                      <input
                        type="number"
                        value={formData.carbs}
                        onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) || 0 })}
                        required
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Тип обработки
                      </label>
                      <select
                        value={formData.processingMethod}
                        onChange={(e) => setFormData({ ...formData, processingMethod: e.target.value as ProcessingMethod })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      >
                        {COOKING_METHODS.map(method => (
                          <option key={method} value={method}>
                            {COOKING_METHOD_LABELS[method]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Тип блюда
                      </label>
                      <select
                        value={formData.dishType}
                        onChange={(e) => setFormData({ ...formData, dishType: e.target.value as DishType })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      >
                        {DISH_TYPES.map(type => (
                          <option key={type} value={type}>
                            {DISH_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Холодное/Горячее
                      </label>
                      <select
                        value={formData.cookingMethod}
                        onChange={(e) => setFormData({ ...formData, cookingMethod: e.target.value as CookingMethod })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      >
                        {COOKING_TYPES.map(type => (
                          <option key={type} value={type}>
                            {COOKING_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Примерная стоимость (₽)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-rose-400/50"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Изображение блюда
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-rose-400/30 cursor-pointer transition-all">
                        <Upload className="w-5 h-5 text-white/60" />
                        <span className="text-white/80">Загрузить фото</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Ингредиенты
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                        placeholder="Добавить ингредиент..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={addIngredient}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition-all font-medium"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.ingredients?.map((ing, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 text-white text-sm"
                        >
                          {ing}
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Инструкции по приготовлению
                    </label>
                    <div className="flex gap-2 mb-2">
                      <textarea
                        value={instructionInput}
                        onChange={(e) => setInstructionInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addInstruction())}
                        placeholder="Добавить шаг приготовления..."
                        rows={2}
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all resize-none"
                      />
                      <button
                        type="button"
                        onClick={addInstruction}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition-all font-medium"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.instructions?.map((inst, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-xl bg-white/5 text-white text-sm"
                        >
                          <span className="text-rose-400 font-bold">{index + 1}.</span>
                          <span className="flex-1">{inst}</span>
                          <button
                            type="button"
                            onClick={() => removeInstruction(index)}
                            className="hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available Products */}
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Доступные продукты
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={productInput}
                        onChange={(e) => setProductInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                        placeholder="Добавить продукт..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={addProduct}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition-all font-medium"
                      >
                        Добавить
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.availableProducts?.map((prod, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 text-white text-sm"
                        >
                          {prod}
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Сохранить рецепт
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false)
                        resetForm()
                      }}
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all font-medium"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

