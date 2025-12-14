'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { Grid3X3 } from 'lucide-react'
import { CategoryCard } from '@/components/ui/CategoryCard'

const categories = [
  {
    id: '1',
    name: 'Фитнес',
    slug: 'fitness',
    description: 'Комплексные тренировки для развития всего тела и улучшения физической формы',
    icon: 'dumbbell',
    color: 'electric',
    coursesCount: 45,
  },
  {
    id: '2',
    name: 'Йога',
    slug: 'yoga',
    description: 'Практики для гибкости, баланса и ментального здоровья',
    icon: 'heart',
    color: 'purple',
    coursesCount: 32,
  },
  {
    id: '3',
    name: 'Единоборства',
    slug: 'martial-arts',
    description: 'Бокс, ММА, каратэ и другие боевые искусства',
    icon: 'swords',
    color: 'flame',
    coursesCount: 28,
  },
  {
    id: '4',
    name: 'Кроссфит',
    slug: 'crossfit',
    description: 'Высокоинтенсивные функциональные тренировки',
    icon: 'flame',
    color: 'neon',
    coursesCount: 19,
  },
  {
    id: '5',
    name: 'Кардио',
    slug: 'cardio',
    description: 'Бег, велосипед, плавание и другие кардионагрузки',
    icon: 'bike',
    color: 'gold',
    coursesCount: 24,
  },
  {
    id: '6',
    name: 'Растяжка',
    slug: 'stretching',
    description: 'Упражнения для развития гибкости и подвижности',
    icon: 'waves',
    color: 'electric',
    coursesCount: 16,
  },
  {
    id: '7',
    name: 'Пилатес',
    slug: 'pilates',
    description: 'Укрепление мышц кора и улучшение осанки',
    icon: 'target',
    color: 'purple',
    coursesCount: 21,
  },
  {
    id: '8',
    name: 'Силовой тренинг',
    slug: 'strength',
    description: 'Набор мышечной массы и развитие силы',
    icon: 'dumbbell',
    color: 'flame',
    coursesCount: 35,
  },
  {
    id: '9',
    name: 'Танцы',
    slug: 'dance',
    description: 'Танцевальные тренировки для хорошего настроения',
    icon: 'users',
    color: 'gold',
    coursesCount: 18,
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
            <Grid3X3 className="w-4 h-4 text-accent-electric" />
            <span className="text-sm text-white/80">Направления</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Категории <span className="gradient-text">курсов</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Выбери направление, которое подходит именно тебе
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

