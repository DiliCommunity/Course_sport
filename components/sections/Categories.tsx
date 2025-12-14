'use client'

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
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  },
  {
    id: '2',
    name: 'Еда',
    slug: 'food',
    description: 'Рецепты кето-блюд, правильное питание и кулинарные мастер-классы',
    icon: 'target',
    color: 'mint',
    coursesCount: 35,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  },
]

export function Categories() {
  return (
    <section className="relative py-24 overflow-hidden bg-dark-800/30">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Grid3X3 className="w-4 h-4 text-accent-teal" />
            <span className="text-sm text-white/80">Категории</span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Выбери свою <span className="gradient-text">категорию</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Кето-диета, интервальное голодание и здоровое питание — всё для твоего здоровья
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} {...category} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

