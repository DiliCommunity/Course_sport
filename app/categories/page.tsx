'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { Grid3X3 } from 'lucide-react'
import { CategoryCard } from '@/components/ui/CategoryCard'

const categories = [
  {
    id: '1',
    name: 'Здоровье',
    slug: 'health',
    description: 'Кето-диета, интервальное голодание и здоровый образ жизни',
    icon: 'heart',
    color: 'teal',
    coursesCount: 28,
  },
  {
    id: '2',
    name: 'Еда',
    slug: 'food',
    description: 'Рецепты кето-блюд, правильное питание и кулинарные мастер-классы',
    icon: 'target',
    color: 'mint',
    coursesCount: 35,
  },
]

export default function CategoriesPage() {
  return (
    <main className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Grid3X3 className="w-4 h-4 text-accent-teal" />
            <span className="text-sm text-white/80">Категории</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Категории <span className="gradient-text">курсов</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Кето-диета, интервальное голодание и здоровое питание
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} {...category} index={index} />
          ))}
        </div>
      </div>
    </main>
  )
}

