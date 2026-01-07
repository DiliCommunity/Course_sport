'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Trash2, Copy, Check, CheckCircle2, Download } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  category: 'protein' | 'fats' | 'vegetables' | 'dairy' | 'nuts' | 'other'
  quantity: string
  checked: boolean
}

const DEFAULT_INGREDIENTS: Ingredient[] = [
  // Белки
  { id: '1', name: 'Яйца', category: 'protein', quantity: '10-12 шт', checked: false },
  { id: '2', name: 'Бекон', category: 'protein', quantity: '200г', checked: false },
  { id: '3', name: 'Лосось', category: 'protein', quantity: '300г', checked: false },
  { id: '4', name: 'Куриная грудка', category: 'protein', quantity: '500г', checked: false },
  { id: '5', name: 'Говядина', category: 'protein', quantity: '400г', checked: false },
  { id: '6', name: 'Тунец консервированный', category: 'protein', quantity: '2 банки', checked: false },
  
  // Жиры
  { id: '7', name: 'Авокадо', category: 'fats', quantity: '3-4 шт', checked: false },
  { id: '8', name: 'Оливковое масло', category: 'fats', quantity: '500мл', checked: false },
  { id: '9', name: 'Кокосовое масло', category: 'fats', quantity: '300мл', checked: false },
  { id: '10', name: 'Сливочное масло', category: 'fats', quantity: '200г', checked: false },
  
  // Овощи
  { id: '11', name: 'Шпинат', category: 'vegetables', quantity: '200г', checked: false },
  { id: '12', name: 'Брокколи', category: 'vegetables', quantity: '300г', checked: false },
  { id: '13', name: 'Цветная капуста', category: 'vegetables', quantity: '300г', checked: false },
  { id: '14', name: 'Салат листовой', category: 'vegetables', quantity: '200г', checked: false },
  { id: '15', name: 'Огурцы', category: 'vegetables', quantity: '3-4 шт', checked: false },
  { id: '16', name: 'Помидоры черри', category: 'vegetables', quantity: '200г', checked: false },
  
  // Молочные
  { id: '17', name: 'Сыр чеддер', category: 'dairy', quantity: '200г', checked: false },
  { id: '18', name: 'Сыр фета', category: 'dairy', quantity: '200г', checked: false },
  { id: '19', name: 'Греческий йогурт', category: 'dairy', quantity: '500г', checked: false },
  { id: '20', name: 'Сливки 33%', category: 'dairy', quantity: '200мл', checked: false },
  
  // Орехи
  { id: '21', name: 'Орехи макадамия', category: 'nuts', quantity: '100г', checked: false },
  { id: '22', name: 'Миндаль', category: 'nuts', quantity: '200г', checked: false },
  { id: '23', name: 'Грецкие орехи', category: 'nuts', quantity: '150г', checked: false },
  
  // Прочее
  { id: '24', name: 'Семена чиа', category: 'other', quantity: '100г', checked: false },
  { id: '25', name: 'Миндальная мука', category: 'other', quantity: '200г', checked: false },
  { id: '26', name: 'Стевия', category: 'other', quantity: '1 упаковка', checked: false },
]

const CATEGORY_LABELS = {
  protein: '🥩 Белки',
  fats: '🥑 Жиры',
  vegetables: '🥬 Овощи',
  dairy: '🧀 Молочные',
  nuts: '🥜 Орехи',
  other: '📦 Прочее'
}

const CATEGORY_COLORS = {
  protein: 'from-red-500/20 to-red-600/20 border-red-500/30',
  fats: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
  vegetables: 'from-green-500/20 to-green-600/20 border-green-500/30',
  dairy: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  nuts: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  other: 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
}

export function ShoppingListGenerator() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(DEFAULT_INGREDIENTS)
  const [newIngredient, setNewIngredient] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [newCategory, setNewCategory] = useState<Ingredient['category']>('other')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

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
    
    let text = '📋 СПИСОК ПОКУПОК (КЕТО)\n\n'
    
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
          <p className="text-white/60 text-sm">Составьте персональный список покупок для кето</p>
        </div>
      </div>

      {/* Добавление нового ингредиента */}
      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
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
            placeholder="Количество"
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
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <button
                      onClick={() => toggleIngredient(ing.id)}
                      className="flex-shrink-0"
                    >
                      {ing.checked ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm ${ing.checked ? 'line-through text-white/40' : 'text-white'}`}>
                        {ing.name}
                      </div>
                      <div className="text-xs text-white/60">{ing.quantity}</div>
                    </div>
                    <button
                      onClick={() => removeIngredient(ing.id)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
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

      {/* Статистика и кнопка копирования */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <div className="text-white/60 text-sm">Выбрано:</div>
          <div className="text-2xl font-bold text-accent-electric">{checkedCount} / {ingredients.length}</div>
        </div>
        <button
          onClick={copyList}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              <span>Скопировано!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Скопировать список</span>
            </>
          )}
        </button>
      </div>

      {/* Кнопка скачивания PDF */}
      <button
        onClick={async () => {
          try {
            setDownloading(true)
            
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
            })

            // Заголовок
            doc.setFontSize(20)
            doc.setTextColor(59, 130, 246) // accent-electric
            doc.text('Список покупок (Кето)', 105, 20, { align: 'center' })
            
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text(`Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}`, 105, 28, { align: 'center' })
            
            let yPos = 40
            const margin = 15
            
            // Группируем по категориям
            const categories = Object.keys(CATEGORY_LABELS) as Ingredient['category'][]
            categories.forEach(category => {
              const categoryIngredients = ingredients.filter(ing => ing.category === category)
              if (categoryIngredients.length > 0) {
                doc.setFontSize(12)
                doc.setTextColor(59, 130, 246)
                doc.setFont('helvetica', 'bold')
                doc.text(CATEGORY_LABELS[category], margin, yPos)
                yPos += 7
                
                doc.setFontSize(11)
                doc.setTextColor(0, 0, 0)
                doc.setFont('helvetica', 'normal')
                categoryIngredients.forEach(ing => {
                  const checkmark = ing.checked ? '☑' : '☐'
                  doc.text(`${checkmark} ${ing.name} - ${ing.quantity}`, margin + 5, yPos)
                  yPos += 6
                })
                yPos += 3
              }
            })
            
            // Статистика
            yPos += 5
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text(`Выбрано: ${checkedCount} / ${ingredients.length}`, margin, yPos)
            
            const fileName = `Кето-список-покупок-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
            doc.save(fileName)
            
            setDownloading(false)
          } catch (error) {
            console.error('Error generating PDF:', error)
            setDownloading(false)
            alert('Не удалось создать PDF файл. Попробуйте еще раз.')
          }
        }}
        disabled={downloading}
        className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-electric/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
            <span>Генерация PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Скачать список в PDF</span>
          </>
        )}
      </button>
    </motion.div>
  )
}

