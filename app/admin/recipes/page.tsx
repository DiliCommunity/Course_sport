'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  ChefHat, Loader2, Plus, X, Upload, Image as ImageIcon,
  Clock, Flame, UtensilsCrossed, FileText, Save, ArrowLeft, Menu,
  Sparkles, Copy, CheckCircle, Search, Filter, Edit, Trash2, Eye,
  Grid3x3, List, TrendingUp, Package, Calendar
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
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAiChefOpen, setIsAiChefOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDishType, setFilterDishType] = useState<DishType | 'all'>('all')
  const [filterCookingMethod, setFilterCookingMethod] = useState<CookingMethod | 'all'>('all')
  const [filterProcessingMethod, setFilterProcessingMethod] = useState<ProcessingMethod | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'prepTime' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // AI Chef states
  const [aiMode, setAiMode] = useState<'chat' | 'recipe' | 'image_prompt'>('chat')
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null)
  const [imagePrompt, setImagePrompt] = useState('')
  const [copied, setCopied] = useState(false)

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
      setFilteredRecipes(data.recipes || [])
    } catch (err) {
      console.error('Error fetching recipes:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search recipes
  useEffect(() => {
    let filtered = [...recipes]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(recipe => 
        recipe.name?.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        (recipe.ingredients as string[])?.some(ing => ing.toLowerCase().includes(query))
      )
    }

    // Dish type filter
    if (filterDishType !== 'all') {
      filtered = filtered.filter(recipe => recipe.dishType === filterDishType)
    }

    // Cooking method filter
    if (filterCookingMethod !== 'all') {
      filtered = filtered.filter(recipe => recipe.cookingMethod === filterCookingMethod)
    }

    // Processing method filter
    if (filterProcessingMethod !== 'all') {
      filtered = filtered.filter(recipe => recipe.processingMethod === filterProcessingMethod)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortBy) {
        case 'name':
          aVal = a.name || ''
          bVal = b.name || ''
          break
        case 'calories':
          aVal = a.calories || 0
          bVal = b.calories || 0
          break
        case 'prepTime':
          aVal = a.prepTime || 0
          bVal = b.prepTime || 0
          break
        case 'created_at':
          aVal = (a as any).created_at || ''
          bVal = (b as any).created_at || ''
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    setFilteredRecipes(filtered)
  }, [recipes, searchQuery, filterDishType, filterCookingMethod, filterProcessingMethod, sortBy, sortOrder])

  // Statistics
  const stats = {
    total: recipes.length,
    byType: {
      snack: recipes.filter(r => r.dishType === 'snack').length,
      first: recipes.filter(r => r.dishType === 'first').length,
      second: recipes.filter(r => r.dishType === 'second').length,
      dessert: recipes.filter(r => r.dishType === 'dessert').length,
    },
    byCooking: {
      hot: recipes.filter(r => r.cookingMethod === 'hot').length,
      cold: recipes.filter(r => r.cookingMethod === 'cold').length,
    },
    avgCalories: recipes.length > 0 
      ? Math.round(recipes.reduce((sum, r) => sum + (r.calories || 0), 0) / recipes.length)
      : 0
  }

  const deleteRecipe = async (id: string) => {
    // Проверяем, не является ли рецепт из кода
    const recipe = recipes.find(r => r.id === id)
    if (recipe && (recipe as any).source === 'code') {
      alert('Рецепты из личного шефа нельзя удалять. Они доступны только для просмотра.')
      return
    }

    if (!confirm('Вы уверены, что хотите удалить этот рецепт?')) return

    try {
      const response = await fetch(`/api/admin/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить рецепт')
      }

      setSuccess('Рецепт успешно удалён!')
      fetchRecipes()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const editRecipe = (recipe: Recipe) => {
    // Проверяем, не является ли рецепт из кода
    if ((recipe as any).source === 'code') {
      alert('Рецепты из личного шефа нельзя редактировать. Они доступны только для просмотра.')
      return
    }

    setEditingRecipe(recipe)
    setFormData({
      name: recipe.name || '',
      description: recipe.description || '',
      calories: recipe.calories || 0,
      proteins: recipe.proteins || 0,
      fats: recipe.fats || 0,
      carbs: recipe.carbs || 0,
      prepTime: recipe.prepTime || 0,
      estimatedCost: (recipe as any).estimated_cost || 0,
      cookingMethod: recipe.cookingMethod || 'hot',
      dishType: recipe.dishType || 'second',
      processingMethod: recipe.processingMethod || 'baking',
      ingredients: recipe.ingredients as string[] || [],
      instructions: recipe.instructions as string[] || [],
      availableProducts: recipe.availableProducts as string[] || []
    })
    if (recipe.image_url) {
      setImagePreview(recipe.image_url)
    }
    setIsModalOpen(true)
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

  const addIngredient = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const trimmed = ingredientInput.trim()
    if (trimmed) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), trimmed]
      }))
      setIngredientInput('')
    }
  }

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients?.filter((_, i) => i !== index) || []
    })
  }

  const addInstruction = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const trimmed = instructionInput.trim()
    if (trimmed) {
      setFormData(prev => ({
        ...prev,
        instructions: [...(prev.instructions || []), trimmed]
      }))
      setInstructionInput('')
    }
  }

  const removeInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions?.filter((_, i) => i !== index) || []
    })
  }

  const addProduct = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const trimmed = productInput.trim()
    if (trimmed) {
      setFormData(prev => ({
        ...prev,
        availableProducts: [...(prev.availableProducts || []), trimmed]
      }))
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

      const url = editingRecipe 
        ? `/api/admin/recipes/${editingRecipe.id}`
        : '/api/admin/recipes'
      
      const response = await fetch(url, {
        method: editingRecipe ? 'PUT' : 'POST',
        credentials: 'include',
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения рецепта')
      }

      if (editingRecipe) {
        setSuccess('Рецепт успешно обновлён!')
        setEditingRecipe(null)
      } else {
        setSuccess('Рецепт успешно добавлен!')
      }
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
    setEditingRecipe(null)
  }


  // AI Chef functions
  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return

    const userMessage = aiInput.trim()
    setAiInput('')
    setAiLoading(true)

    const newMessages = [...aiMessages, { role: 'user' as const, content: userMessage }]
    setAiMessages(newMessages)

    try {
      const response = await fetch('/api/admin/ai-chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: newMessages,
          mode: aiMode
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка при обращении к AI' }))
        throw new Error(errorData.error || `Ошибка ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (aiMode === 'recipe' && data.recipe) {
        setGeneratedRecipe(data.recipe)
        setAiMessages([...newMessages, { role: 'assistant', content: data.response || 'Рецепт сгенерирован!' }])
      } else if (aiMode === 'image_prompt' && data.response) {
        setImagePrompt(data.response)
        setAiMessages([...newMessages, { role: 'assistant', content: 'Промпт для изображения сгенерирован!' }])
      } else {
        setAiMessages([...newMessages, { role: 'assistant', content: data.response || 'Ответ получен' }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обращении к AI')
      setAiMessages([...newMessages, { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте еще раз.' }])
    } finally {
      setAiLoading(false)
    }
  }

  const applyGeneratedRecipe = () => {
    if (!generatedRecipe) return

    setFormData({
      name: generatedRecipe.name || '',
      description: generatedRecipe.description || '',
      calories: generatedRecipe.calories || 0,
      proteins: generatedRecipe.proteins || 0,
      fats: generatedRecipe.fats || 0,
      carbs: generatedRecipe.carbs || 0,
      prepTime: generatedRecipe.prepTime || 0,
      cookingMethod: generatedRecipe.cookingMethod || 'hot',
      dishType: generatedRecipe.dishType || 'second',
      processingMethod: generatedRecipe.processingMethod || 'baking',
      ingredients: generatedRecipe.ingredients || [],
      instructions: generatedRecipe.instructions || [],
      availableProducts: []
    })

    setGeneratedRecipe(null)
    setIsAiChefOpen(false)
    setIsModalOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <button
              onClick={() => setIsAiChefOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              AI Шеф
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

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Всего рецептов</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Средние калории</p>
                <p className="text-2xl font-bold text-white">{stats.avgCalories}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Горячих блюд</p>
                <p className="text-2xl font-bold text-white">{stats.byCooking.hot}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Вторых блюд</p>
                <p className="text-2xl font-bold text-white">{stats.byType.second}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию, описанию или ингредиентам..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-white/60 text-sm">Фильтры:</span>
            </div>
            
            <select
              value={filterDishType}
              onChange={(e) => setFilterDishType(e.target.value as DishType | 'all')}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400/50"
            >
              <option value="all">Все типы</option>
              {DISH_TYPES.map(type => (
                <option key={type} value={type}>{DISH_TYPE_LABELS[type]}</option>
              ))}
            </select>

            <select
              value={filterCookingMethod}
              onChange={(e) => setFilterCookingMethod(e.target.value as CookingMethod | 'all')}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400/50"
            >
              <option value="all">Холодное/Горячее</option>
              {COOKING_TYPES.map(type => (
                <option key={type} value={type}>{COOKING_TYPE_LABELS[type]}</option>
              ))}
            </select>

            <select
              value={filterProcessingMethod}
              onChange={(e) => setFilterProcessingMethod(e.target.value as ProcessingMethod | 'all')}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400/50"
            >
              <option value="all">Все способы</option>
              {COOKING_METHODS.map(method => (
                <option key={method} value={method}>{COOKING_METHOD_LABELS[method]}</option>
              ))}
            </select>

            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('_')
                setSortBy(by as any)
                setSortOrder(order as any)
              }}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-400/50"
            >
              <option value="created_at_desc">Новые сначала</option>
              <option value="created_at_asc">Старые сначала</option>
              <option value="name_asc">По названию (А-Я)</option>
              <option value="name_desc">По названию (Я-А)</option>
              <option value="calories_desc">По калориям (↓)</option>
              <option value="calories_asc">По калориям (↑)</option>
              <option value="prepTime_asc">По времени (↑)</option>
              <option value="prepTime_desc">По времени (↓)</option>
            </select>

            <button
              onClick={() => {
                setSearchQuery('')
                setFilterDishType('all')
                setFilterCookingMethod('all')
                setFilterProcessingMethod('all')
                setSortBy('name')
                setSortOrder('asc')
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
            >
              Показать все по алфавиту
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-white/60 text-sm">
            Найдено: <span className="text-white font-medium">{filteredRecipes.length}</span> из {recipes.length}
          </div>
        </div>

        {/* Recipes List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id || recipe.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl glass border border-white/10 p-6 hover:border-white/20 transition-all group relative"
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewingRecipe(recipe)}
                    className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 flex items-center justify-center transition-all"
                    title="Просмотр"
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => editRecipe(recipe)}
                    className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 flex items-center justify-center transition-all"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4 text-green-400" />
                  </button>
                  <button
                    onClick={() => recipe.id && deleteRecipe(recipe.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                {recipe.image_url && (
                  <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-white/5">
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white flex-1">{recipe.name}</h3>
                  <span className="px-2 py-1 rounded-lg bg-white/10 text-white/80 text-xs ml-2">
                    {DISH_TYPE_LABELS[recipe.dishType as DishType] || 'Блюдо'}
                  </span>
                </div>
                {recipe.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {recipe.prepTime} мин
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {recipe.calories} ккал
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60 text-xs">
                    {COOKING_TYPE_LABELS[recipe.cookingMethod as CookingMethod] || 'Горячее'}
                  </span>
                  {recipe.processingMethod && (
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60 text-xs">
                      {COOKING_METHOD_LABELS[recipe.processingMethod as ProcessingMethod]}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id || recipe.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl glass border border-white/10 p-4 hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {recipe.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{recipe.name}</h3>
                        {recipe.description && (
                          <p className="text-white/60 text-sm line-clamp-1">{recipe.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingRecipe(recipe)}
                          className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 flex items-center justify-center transition-all"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        {(recipe as any).source !== 'code' && (
                          <>
                            <button
                              onClick={() => editRecipe(recipe)}
                              className="w-8 h-8 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 flex items-center justify-center transition-all"
                              title="Редактировать"
                            >
                              <Edit className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => recipe.id && deleteRecipe(recipe.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                        {(recipe as any).source === 'code' && (
                          <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs border border-purple-500/40">
                            Из кода
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime} мин
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        {recipe.calories} ккал
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-white/10 text-white/80 text-xs">
                        {DISH_TYPE_LABELS[recipe.dishType as DishType] || 'Блюдо'}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60 text-xs">
                        {COOKING_TYPE_LABELS[recipe.cookingMethod as CookingMethod] || 'Горячее'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Рецепты не найдены</p>
            <p className="text-white/40 text-sm mt-2">Попробуйте изменить фильтры или добавить новый рецепт</p>
          </div>
        )}

        {/* Add Recipe Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 pb-4 px-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
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
                      {editingRecipe ? 'Редактировать рецепт' : 'Добавить новый рецепт'}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addIngredient(e)
                          }
                        }}
                        placeholder="Добавить ингредиент..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={(e) => addIngredient(e)}
                        disabled={!ingredientInput.trim()}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-500/20"
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            addInstruction(e)
                          }
                        }}
                        placeholder="Добавить шаг приготовления..."
                        rows={2}
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all resize-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => addInstruction(e)}
                        disabled={!instructionInput.trim()}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-500/20"
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addProduct(e)
                          }
                        }}
                        placeholder="Добавить продукт..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={(e) => addProduct(e)}
                        disabled={!productInput.trim()}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-500/20"
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

        {/* AI Chef Modal */}
        <AnimatePresence>
          {isAiChefOpen && (
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 pb-4 px-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAiChefOpen(false)}
                className="absolute inset-0 bg-dark-900/90 backdrop-blur-md"
                style={{ zIndex: 9998 }}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl glass border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                style={{ zIndex: 9999 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-2xl" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="sticky top-0 z-50 flex items-center justify-between p-6 border-b border-white/10 bg-dark-800/95 backdrop-blur-sm rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">AI Шеф</h2>
                    </div>
                    <button
                      onClick={() => {
                        setIsAiChefOpen(false)
                        setAiMessages([])
                        setGeneratedRecipe(null)
                        setImagePrompt('')
                        setAiInput('')
                      }}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/40 flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5 text-white/80 hover:text-white" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {/* Mode Selector */}
                    <div className="mb-6 flex gap-3">
                      <button
                        onClick={() => {
                          setAiMode('chat')
                          setGeneratedRecipe(null)
                          setImagePrompt('')
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                          aiMode === 'chat'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        Чат
                      </button>
                      <button
                        onClick={() => {
                          setAiMode('recipe')
                          setGeneratedRecipe(null)
                          setImagePrompt('')
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                          aiMode === 'recipe'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        Генерация рецепта
                      </button>
                      <button
                        onClick={() => {
                          setAiMode('image_prompt')
                          setGeneratedRecipe(null)
                          setImagePrompt('')
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                          aiMode === 'image_prompt'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        Промпт для изображения
                      </button>
                    </div>

                    {/* Generated Recipe */}
                    {generatedRecipe && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-green-400">Рецепт сгенерирован!</h3>
                          <button
                            onClick={applyGeneratedRecipe}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-all"
                          >
                            Применить к форме
                          </button>
                        </div>
                        <div className="text-white/80 space-y-2 text-sm">
                          <p><strong>Название:</strong> {generatedRecipe.name}</p>
                          <p><strong>Описание:</strong> {generatedRecipe.description}</p>
                          <p><strong>КБЖУ:</strong> {generatedRecipe.calories} ккал, Б: {generatedRecipe.proteins}г, Ж: {generatedRecipe.fats}г, У: {generatedRecipe.carbs}г</p>
                          <p><strong>Время:</strong> {generatedRecipe.prepTime} мин</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Image Prompt */}
                    {imagePrompt && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-blue-400">Промпт для изображения</h3>
                          <button
                            onClick={() => copyToClipboard(imagePrompt)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium transition-all"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Скопировано
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Копировать
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">{imagePrompt}</p>
                      </motion.div>
                    )}

                    {/* Chat Messages */}
                    <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
                      {aiMessages.length === 0 && (
                        <div className="text-center py-8 text-white/60">
                          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400/50" />
                          <p className="text-lg font-medium mb-2">Добро пожаловать, AI Шеф готов помочь!</p>
                          <p className="text-sm">
                            {aiMode === 'recipe' && 'Опишите блюдо, которое хотите создать, и я сгенерирую полный рецепт.'}
                            {aiMode === 'image_prompt' && 'Опишите блюдо, и я создам детальный промпт для генерации изображения.'}
                            {aiMode === 'chat' && 'Задайте любой вопрос о рецептах, кулинарии или создании блюд.'}
                          </p>
                        </div>
                      )}
                      {aiMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl p-4 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/10 text-white/90'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 rounded-xl p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendAiMessage()
                          }
                        }}
                        placeholder={
                          aiMode === 'recipe' 
                            ? 'Например: "Создай рецепт кето-чизкейка с ягодами"'
                            : aiMode === 'image_prompt'
                            ? 'Например: "Куриная грудка с овощами"'
                            : 'Задайте вопрос...'
                        }
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all"
                      />
                      <button
                        onClick={sendAiMessage}
                        disabled={aiLoading || !aiInput.trim()}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Отправить'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* View Recipe Modal */}
        <AnimatePresence>
          {viewingRecipe && (
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 pb-4 px-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingRecipe(null)}
                className="absolute inset-0 bg-dark-900/90 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl glass border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-red-500/10 rounded-2xl" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="sticky top-0 z-50 flex items-center justify-between p-6 border-b border-white/10 bg-dark-800/95 backdrop-blur-sm rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ChefHat className="w-6 h-6 text-rose-400" />
                      {viewingRecipe.name}
                    </h2>
                    <button
                      onClick={() => setViewingRecipe(null)}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/40 flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5 text-white/80 hover:text-white" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Image */}
                    {viewingRecipe.image_url && (
                      <div className="w-full h-64 rounded-xl overflow-hidden bg-white/5">
                        <img 
                          src={viewingRecipe.image_url} 
                          alt={viewingRecipe.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Description */}
                    {viewingRecipe.description && (
                      <p className="text-white/80 leading-relaxed">{viewingRecipe.description}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-rose-400" />
                          <span className="text-white/60 text-sm">Калории</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{viewingRecipe.calories}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed className="w-5 h-5 text-blue-400" />
                          <span className="text-white/60 text-sm">Белки</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{viewingRecipe.proteins}г</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
                          <span className="text-white/60 text-sm">Жиры</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{viewingRecipe.fats}г</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-green-400" />
                          <span className="text-white/60 text-sm">Время</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{viewingRecipe.prepTime} мин</p>
                      </div>
                    </div>

                    {/* Ingredients */}
                    {viewingRecipe.ingredients && (viewingRecipe.ingredients as string[]).length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">Ингредиенты</h3>
                        <ul className="space-y-2">
                          {(viewingRecipe.ingredients as string[]).map((ing, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-white/80">
                              <span className="text-rose-400 mt-1">•</span>
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {viewingRecipe.instructions && (viewingRecipe.instructions as string[]).length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">Инструкции</h3>
                        <ol className="space-y-3">
                          {(viewingRecipe.instructions as string[]).map((inst, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-white/80">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold flex items-center justify-center text-sm">
                                {idx + 1}
                              </span>
                              <span className="flex-1">{inst}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                      <span className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-sm">
                        {DISH_TYPE_LABELS[viewingRecipe.dishType as DishType] || 'Блюдо'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-sm">
                        {COOKING_TYPE_LABELS[viewingRecipe.cookingMethod as CookingMethod] || 'Горячее'}
                      </span>
                      {viewingRecipe.processingMethod && (
                        <span className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-sm">
                          {COOKING_METHOD_LABELS[viewingRecipe.processingMethod as ProcessingMethod]}
                        </span>
                      )}
                    </div>
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

