'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Trash2, Copy, Check, CheckCircle2, Download, Search, X } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  category: 'protein' | 'fats' | 'vegetables' | 'dairy' | 'nuts' | 'grains' | 'fruits' | 'spices' | 'beverages' | 'other'
  quantity: string
  checked: boolean
}

// Большой каталог доступных продуктов
const AVAILABLE_PRODUCTS: Omit<Ingredient, 'id' | 'checked'>[] = [
  // Белки
  { name: 'Яйца', category: 'protein', quantity: '10-12 шт' },
  { name: 'Бекон', category: 'protein', quantity: '200г' },
  { name: 'Лосось', category: 'protein', quantity: '300г' },
  { name: 'Куриная грудка', category: 'protein', quantity: '500г' },
  { name: 'Говядина', category: 'protein', quantity: '400г' },
  { name: 'Свинина', category: 'protein', quantity: '400г' },
  { name: 'Индейка', category: 'protein', quantity: '500г' },
  { name: 'Баранина', category: 'protein', quantity: '400г' },
  { name: 'Тунец консервированный', category: 'protein', quantity: '2 банки' },
  { name: 'Сёмга', category: 'protein', quantity: '300г' },
  { name: 'Форель', category: 'protein', quantity: '300г' },
  { name: 'Скумбрия', category: 'protein', quantity: '300г' },
  { name: 'Креветки', category: 'protein', quantity: '300г' },
  { name: 'Кальмары', category: 'protein', quantity: '300г' },
  { name: 'Мидии', category: 'protein', quantity: '300г' },
  { name: 'Краб', category: 'protein', quantity: '200г' },
  { name: 'Печень куриная', category: 'protein', quantity: '300г' },
  { name: 'Сердце куриное', category: 'protein', quantity: '300г' },
  
  // Жиры
  { name: 'Авокадо', category: 'fats', quantity: '3-4 шт' },
  { name: 'Оливковое масло', category: 'fats', quantity: '500мл' },
  { name: 'Кокосовое масло', category: 'fats', quantity: '300мл' },
  { name: 'Сливочное масло', category: 'fats', quantity: '200г' },
  { name: 'Масло гхи', category: 'fats', quantity: '200г' },
  { name: 'Масло авокадо', category: 'fats', quantity: '250мл' },
  { name: 'Оливки', category: 'fats', quantity: '200г' },
  { name: 'Майонез домашний', category: 'fats', quantity: '200г' },
  { name: 'Сало', category: 'fats', quantity: '150г' },
  
  // Овощи
  { name: 'Шпинат', category: 'vegetables', quantity: '200г' },
  { name: 'Брокколи', category: 'vegetables', quantity: '300г' },
  { name: 'Цветная капуста', category: 'vegetables', quantity: '300г' },
  { name: 'Салат листовой', category: 'vegetables', quantity: '200г' },
  { name: 'Огурцы', category: 'vegetables', quantity: '3-4 шт' },
  { name: 'Помидоры черри', category: 'vegetables', quantity: '200г' },
  { name: 'Кабачки', category: 'vegetables', quantity: '2 шт' },
  { name: 'Баклажаны', category: 'vegetables', quantity: '2 шт' },
  { name: 'Перец болгарский', category: 'vegetables', quantity: '3-4 шт' },
  { name: 'Лук репчатый', category: 'vegetables', quantity: '3-4 шт' },
  { name: 'Чеснок', category: 'vegetables', quantity: '1 головка' },
  { name: 'Морковь', category: 'vegetables', quantity: '3-4 шт' },
  { name: 'Сельдерей', category: 'vegetables', quantity: '2-3 стебля' },
  { name: 'Руккола', category: 'vegetables', quantity: '100г' },
  { name: 'Капуста белокочанная', category: 'vegetables', quantity: '500г' },
  { name: 'Капуста пекинская', category: 'vegetables', quantity: '300г' },
  { name: 'Редис', category: 'vegetables', quantity: '200г' },
  { name: 'Грибы шампиньоны', category: 'vegetables', quantity: '300г' },
  { name: 'Грибы вешенки', category: 'vegetables', quantity: '300г' },
  { name: 'Зелень (петрушка, укроп)', category: 'vegetables', quantity: '1 пучок' },
  
  // Молочные
  { name: 'Сыр чеддер', category: 'dairy', quantity: '200г' },
  { name: 'Сыр фета', category: 'dairy', quantity: '200г' },
  { name: 'Сыр моцарелла', category: 'dairy', quantity: '200г' },
  { name: 'Сыр пармезан', category: 'dairy', quantity: '100г' },
  { name: 'Сыр гауда', category: 'dairy', quantity: '200г' },
  { name: 'Сыр бри', category: 'dairy', quantity: '150г' },
  { name: 'Греческий йогурт', category: 'dairy', quantity: '500г' },
  { name: 'Сливки 33%', category: 'dairy', quantity: '200мл' },
  { name: 'Сметана 20%', category: 'dairy', quantity: '300г' },
  { name: 'Творог', category: 'dairy', quantity: '300г' },
  { name: 'Сливочный сыр', category: 'dairy', quantity: '200г' },
  { name: 'Кефир', category: 'dairy', quantity: '500мл' },
  
  // Орехи и семена
  { name: 'Орехи макадамия', category: 'nuts', quantity: '100г' },
  { name: 'Миндаль', category: 'nuts', quantity: '200г' },
  { name: 'Грецкие орехи', category: 'nuts', quantity: '150г' },
  { name: 'Кешью', category: 'nuts', quantity: '150г' },
  { name: 'Фундук', category: 'nuts', quantity: '150г' },
  { name: 'Фисташки', category: 'nuts', quantity: '100г' },
  { name: 'Бразильский орех', category: 'nuts', quantity: '100г' },
  { name: 'Семена чиа', category: 'nuts', quantity: '100г' },
  { name: 'Семена льна', category: 'nuts', quantity: '100г' },
  { name: 'Семена подсолнечника', category: 'nuts', quantity: '150г' },
  { name: 'Кунжут', category: 'nuts', quantity: '100г' },
  { name: 'Тыквенные семечки', category: 'nuts', quantity: '150г' },
  
  // Крупы и зерновые
  { name: 'Гречка', category: 'grains', quantity: '300г' },
  { name: 'Рис бурый', category: 'grains', quantity: '300г' },
  { name: 'Киноа', category: 'grains', quantity: '200г' },
  { name: 'Овсянка', category: 'grains', quantity: '300г' },
  { name: 'Булгур', category: 'grains', quantity: '300г' },
  { name: 'Полба', category: 'grains', quantity: '300г' },
  { name: 'Амарант', category: 'grains', quantity: '200г' },
  { name: 'Пшено', category: 'grains', quantity: '300г' },
  
  // Фрукты и ягоды
  { name: 'Яблоки', category: 'fruits', quantity: '500г' },
  { name: 'Груши', category: 'fruits', quantity: '500г' },
  { name: 'Бананы', category: 'fruits', quantity: '3-4 шт' },
  { name: 'Апельсины', category: 'fruits', quantity: '4-5 шт' },
  { name: 'Мандарины', category: 'fruits', quantity: '500г' },
  { name: 'Лимон', category: 'fruits', quantity: '2-3 шт' },
  { name: 'Лайм', category: 'fruits', quantity: '2-3 шт' },
  { name: 'Клубника', category: 'fruits', quantity: '300г' },
  { name: 'Малина', category: 'fruits', quantity: '200г' },
  { name: 'Черника', category: 'fruits', quantity: '200г' },
  { name: 'Ежевика', category: 'fruits', quantity: '200г' },
  { name: 'Виноград', category: 'fruits', quantity: '300г' },
  
  // Специи и приправы
  { name: 'Соль морская', category: 'spices', quantity: '1 упаковка' },
  { name: 'Перец чёрный', category: 'spices', quantity: '1 упаковка' },
  { name: 'Перец красный', category: 'spices', quantity: '1 упаковка' },
  { name: 'Куркума', category: 'spices', quantity: '1 упаковка' },
  { name: 'Паприка', category: 'spices', quantity: '1 упаковка' },
  { name: 'Кориандр', category: 'spices', quantity: '1 упаковка' },
  { name: 'Базилик сушёный', category: 'spices', quantity: '1 упаковка' },
  { name: 'Орегано', category: 'spices', quantity: '1 упаковка' },
  { name: 'Розмарин', category: 'spices', quantity: '1 упаковка' },
  { name: 'Тимьян', category: 'spices', quantity: '1 упаковка' },
  { name: 'Имбирь', category: 'spices', quantity: '50г' },
  { name: 'Лавровый лист', category: 'spices', quantity: '1 упаковка' },
  
  // Напитки
  { name: 'Вода минеральная', category: 'beverages', quantity: '1.5л' },
  { name: 'Чай зелёный', category: 'beverages', quantity: '1 упаковка' },
  { name: 'Чай чёрный', category: 'beverages', quantity: '1 упаковка' },
  { name: 'Кофе молотый', category: 'beverages', quantity: '250г' },
  { name: 'Кофе в зёрнах', category: 'beverages', quantity: '250г' },
  
  // Прочее
  { name: 'Миндальная мука', category: 'other', quantity: '200г' },
  { name: 'Кокосовая мука', category: 'other', quantity: '200г' },
  { name: 'Стевия', category: 'other', quantity: '1 упаковка' },
  { name: 'Эритрит', category: 'other', quantity: '200г' },
  { name: 'Уксус яблочный', category: 'other', quantity: '250мл' },
  { name: 'Соевый соус', category: 'other', quantity: '250мл' },
  { name: 'Горчица', category: 'other', quantity: '1 баночка' },
  { name: 'Хрен', category: 'other', quantity: '1 баночка' },
]

const CATEGORY_LABELS = {
  protein: '🥩 Белки',
  fats: '🥑 Жиры',
  vegetables: '🥬 Овощи',
  dairy: '🧀 Молочные',
  nuts: '🥜 Орехи и семена',
  grains: '🌾 Крупы и зерновые',
  fruits: '🍎 Фрукты и ягоды',
  spices: '🧂 Специи и приправы',
  beverages: '🥤 Напитки',
  other: '📦 Прочее'
}

const CATEGORY_COLORS = {
  protein: 'from-red-500/20 to-red-600/20 border-red-500/30',
  fats: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
  vegetables: 'from-green-500/20 to-green-600/20 border-green-500/30',
  dairy: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  nuts: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  grains: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
  fruits: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
  spices: 'from-rose-500/20 to-rose-600/20 border-rose-500/30',
  beverages: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
  other: 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
}

export function ShoppingListGenerator() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [newCategory, setNewCategory] = useState<Ingredient['category']>('other')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Ingredient['category'] | 'all'>('all')

  // Фильтрация доступных продуктов
  const filteredProducts = useMemo(() => {
    return AVAILABLE_PRODUCTS.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const notInList = !ingredients.some(ing => ing.name === product.name)
      return matchesSearch && matchesCategory && notInList
    })
  }, [searchQuery, selectedCategory, ingredients])

  const addProductFromCatalog = (product: Omit<Ingredient, 'id' | 'checked'>) => {
    const newIng: Ingredient = {
      id: Date.now().toString(),
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      checked: false
    }
    
    setIngredients([...ingredients, newIng])
  }

  const toggleIngredient = (id: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, checked: !ing.checked } : ing
    ))
  }

  const addIngredient = () => {
    if (!newIngredient.trim()) return
    
    const newIng: Ingredient = {
      id: Date.now().toString(),
      name: newIngredient.trim(),
      category: newCategory,
      quantity: newQuantity.trim() || 'по необходимости',
      checked: false
    }
    
    setIngredients([...ingredients, newIng])
    setNewIngredient('')
    setNewQuantity('')
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id))
  }

  const copyList = () => {
    const checkedIngredients = ingredients.filter(ing => ing.checked)
    const uncheckedIngredients = ingredients.filter(ing => !ing.checked)
    
    let text = '📋 СПИСОК ПОКУПОК\n\n'
    
    // Группируем по категориям
    const categories = Object.keys(CATEGORY_LABELS) as Ingredient['category'][]
    categories.forEach(category => {
      const categoryIngredients = checkedIngredients.filter(ing => ing.category === category)
      if (categoryIngredients.length > 0) {
        text += `${CATEGORY_LABELS[category]}\n`
        categoryIngredients.forEach(ing => {
          text += `☑ ${ing.name} - ${ing.quantity}\n`
        })
        text += '\n'
      }
    })
    
    if (uncheckedIngredients.length > 0) {
      text += '📝 Дополнительно:\n'
      uncheckedIngredients.forEach(ing => {
        text += `☐ ${ing.name} - ${ing.quantity}\n`
      })
    }
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const groupByCategory = (ingList: Ingredient[]) => {
    const grouped: Record<string, Ingredient[]> = {}
    ingList.forEach(ing => {
      if (!grouped[ing.category]) {
        grouped[ing.category] = []
      }
      grouped[ing.category].push(ing)
    })
    return grouped
  }

  const categories = groupByCategory(ingredients)
  const checkedCount = ingredients.filter(ing => ing.checked).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-electric/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-electric/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-teal flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Генератор списка покупок</h3>
          <p className="text-white/60 text-sm">Выберите продукты из каталога или добавьте свои</p>
        </div>
      </div>

      {/* Поиск и фильтр категорий */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск продуктов..."
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric/50 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-accent-electric text-dark-900'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
            }`}
          >
            Все
          </button>
          {(Object.keys(CATEGORY_LABELS) as Ingredient['category'][]).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-accent-electric text-dark-900'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {CATEGORY_LABELS[category].replace(/^\S+\s/, '')}
            </button>
          ))}
        </div>
      </div>

      {/* Каталог продуктов */}
      {filteredProducts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-white font-medium mb-3 text-sm">Доступные продукты ({filteredProducts.length}):</h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {filteredProducts.slice(0, 100).map((product, idx) => (
              <button
                key={`${product.name}-${idx}`}
                onClick={() => addProductFromCatalog(product)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-accent-electric/20 hover:text-white border border-white/10 hover:border-accent-electric/50 transition-all text-xs font-medium flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                {product.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Добавление своего продукта */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-white font-medium mb-3 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить свой продукт
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
            placeholder="Название продукта"
            className="md:col-span-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric/50 text-sm"
          />
          <input
            type="text"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
            placeholder="Количество или вес"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric/50 text-sm"
          />
          <button
            onClick={addIngredient}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {/* Список ингредиентов по категориям */}
      {ingredients.length > 0 ? (
        <div className="space-y-4 mb-6">
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
            const categoryIngredients = categories[category] || []
            if (categoryIngredients.length === 0) return null
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[category as Ingredient['category']]} border-2`}
              >
                <h4 className="text-white font-semibold mb-3">{label}</h4>
                <div className="space-y-2">
                  {categoryIngredients.map(ing => (
                    <div
                      key={ing.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => toggleIngredient(ing.id)}
                    >
                      <div
                        className="flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ing.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                        )}
                      </div>
                      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <div className={`text-sm ${ing.checked ? 'line-through text-white/40' : 'text-white'}`}>
                          {ing.name}
                        </div>
                        <div className="text-xs text-white/60">{ing.quantity}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeIngredient(ing.id)
                        }}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="mb-6 p-6 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-white/60 text-sm">Список покупок пуст. Выберите продукты из каталога или добавьте свои.</p>
        </div>
      )}

      {/* Статистика и кнопки действий */}
      {ingredients.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="text-white/60 text-sm">Выбрано:</div>
              <div className="text-2xl font-bold text-accent-electric">{checkedCount} / {ingredients.length}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={copyList}
              className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-accent-mint" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать</span>
                </>
              )}
            </button>
            
            <button
              onClick={async () => {
                try {
                  setDownloading(true)
                  
                  const printContent = document.createElement('div')
                  printContent.style.position = 'absolute'
                  printContent.style.left = '-9999px'
                  printContent.style.width = '800px'
                  printContent.style.padding = '50px'
                  printContent.style.background = 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0a0a0b 100%)'
                  printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif'
                  printContent.style.color = '#ffffff'
                  printContent.style.borderRadius = '20px'

                  const categories = Object.keys(CATEGORY_LABELS) as Ingredient['category'][]
                  const categoriesHtml = categories.map(category => {
                    const categoryIngredients = ingredients.filter(ing => ing.category === category && ing.checked)
                    if (categoryIngredients.length === 0) return ''
                    return `
                      <div style="margin-bottom: 30px;">
                        <h3 style="
                          font-size: 20px;
                          color: #00d4ff;
                          margin: 0 0 15px 0;
                          font-weight: bold;
                        ">${CATEGORY_LABELS[category]}:</h3>
                        <div style="
                          background: rgba(255, 255, 255, 0.05);
                          border: 1px solid rgba(255, 255, 255, 0.1);
                          border-radius: 12px;
                          padding: 20px;
                          backdrop-filter: blur(10px);
                        ">
                          <ul style="margin: 0; padding-left: 25px; list-style: none; line-height: 2;">
                            ${categoryIngredients.map(ing => `
                              <li style="
                                color: rgba(255, 255, 255, 0.9);
                                font-size: 16px;
                                margin-bottom: 8px;
                                padding-left: 25px;
                                position: relative;
                              ">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">✓</span>
                                ${ing.name} - ${ing.quantity}
                              </li>
                            `).join('')}
                          </ul>
                        </div>
                      </div>
                    `
                  }).join('')

                  printContent.innerHTML = `
                    <div style="
                      background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
                      border: 2px solid rgba(0, 212, 255, 0.3);
                      border-radius: 20px;
                      padding: 40px;
                      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 212, 255, 0.1);
                    ">
                      <h1 style="
                        font-size: 38px;
                        font-weight: bold;
                        text-align: center;
                        margin: 0 0 10px 0;
                        background: linear-gradient(135deg, #00d4ff 0%, #10b981 100%);
                        color: #00d4ff;
                        text-shadow: 0 0 30px rgba(0, 212, 255, 0.5), 0 2px 10px rgba(0, 0, 0, 0.5);
                      ">
                        Список покупок
                      </h1>
                      <p style="text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 16px; margin: 0 0 40px 0; text-transform: uppercase; letter-spacing: 2px;">
                        Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}
                      </p>
                      ${categoriesHtml}
                      <div style="
                        background: rgba(0, 212, 255, 0.15);
                        border: 1px solid rgba(0, 212, 255, 0.3);
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 30px;
                        text-align: center;
                      ">
                        <p style="
                          color: #00d4ff;
                          font-size: 18px;
                          font-weight: bold;
                          margin: 0;
                        ">
                          Выбрано: ${checkedCount} / ${ingredients.length}
                        </p>
                      </div>
                    </div>
                  `

                  document.body.appendChild(printContent)

                  const html2canvas = (await import('html2canvas')).default
                  const canvas = await html2canvas(printContent, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#0a0a0b',
                    allowTaint: true
                  })

                  document.body.removeChild(printContent)

                  const { jsPDF } = await import('jspdf')
                  const imgData = canvas.toDataURL('image/png', 0.95)
                  const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                  })

                  const imgWidth = 210
                  const pageHeight = 297
                  let imgHeight = (canvas.height * imgWidth) / canvas.width
                  let heightLeft = imgHeight
                  let position = 0

                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                  heightLeft -= pageHeight

                  while (heightLeft >= 0) {
                    position = heightLeft - imgHeight
                    pdf.addPage()
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                    heightLeft -= pageHeight
                  }

                  const fileName = `Список-покупок-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
                  const pdfBlob = pdf.output('blob')
                  const blobUrl = URL.createObjectURL(pdfBlob)

                  const link = document.createElement('a')
                  link.href = blobUrl
                  link.download = fileName
                  link.style.display = 'none'

                  document.body.appendChild(link)
                  link.click()

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
              }}
              disabled={downloading}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-electric/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Скачать PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
