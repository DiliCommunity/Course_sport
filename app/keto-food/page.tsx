'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Категории рецептов
const categories = [
  { id: 'breakfast', name: 'Завтрак', icon: '🌅', desc: 'Начните день с правильного кето-завтрака' },
  { id: 'lunch', name: 'Обед', icon: '🍽️', desc: 'Сытные и полезные кето-обеды' },
  { id: 'dinner', name: 'Ужин', icon: '🌙', desc: 'Легкие и вкусные кето-ужины' },
  { id: 'snacks', name: 'Перекусы', icon: '🥜', desc: 'Полезные кето-перекусы между приемами пищи' },
  { id: 'desserts', name: 'Десерты', icon: '🍰', desc: 'Сладкие кето-десерты без сахара' },
]

export default function KetoFoodPage() {
  const [activeCategory, setActiveCategory] = useState('breakfast')

  return (
    <main className="min-h-screen pt-28 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-gold/10 border border-accent-gold/30 mb-6">
            <span className="text-2xl">🍽️</span>
            <span className="text-accent-gold font-semibold">Кето-рецепты</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            100 лучших кето-рецептов
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            От завтрака до ужина. Вкусные и полезные блюда для кето-диеты
          </p>
        </motion.div>
      </section>

      {/* Categories Navigation */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-accent-electric text-dark-900'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl mr-2">{category.icon}</span>
              {category.name}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Food Items Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: activeCategory === category.id ? 1 : 0 }}
            className={activeCategory === category.id ? 'block' : 'hidden'}
          >
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">
                <span className="gradient-text">{category.name}</span>
              </h2>
              <p className="text-white/60">{category.desc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder для рецептов - будет заполнено из БД или статики */}
              <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="aspect-video bg-white/5 rounded-xl mb-4 flex items-center justify-center text-4xl">
                  🍳
                </div>
                <h3 className="font-semibold text-white mb-2">Рецепт 1</h3>
                <p className="text-white/60 text-sm mb-4">Описание рецепта...</p>
                <button className="text-accent-electric hover:underline text-sm font-medium">
                  Открыть рецепт →
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Вернуться к курсам
        </Link>
      </div>
    </main>
  )
}

