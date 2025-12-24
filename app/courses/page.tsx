'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { CourseCard } from '@/components/ui/CourseCard'
import { Button } from '@/components/ui/Button'

// Все курсы: 15% бесплатно, полный доступ за 1500₽
// Только 2 курса как в HTML версии
const allCourses = [
  {
    id: '1',
    title: 'Кето Диета: Наука Жиросжигания. От Мифов к Результатам',
    shortDescription: 'Изучи основы кето-диеты, научись правильно рассчитывать макросы и составлять меню. Начни свой путь к здоровью и стройности!',
    imageUrl: '/keto_course.png',
    price: 1500,
    originalPrice: 4999,
    duration: 1200,
    studentsCount: 12453,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Анна Здоровьева',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    category: 'Здоровье',
  },
  {
    id: '2',
    title: 'Интервальное Голодание: Ваш Режим Дня для Здоровья и Энергии. Ешьте Что Хотите (В Свое Время)',
    shortDescription: 'Освой метод интервального голодания 16/8. Узнай, как правильно голодать и получать максимальную пользу для здоровья и похудения.',
    imageUrl: '/interval_course.png',
    price: 1500,
    originalPrice: 4999,
    duration: 960,
    studentsCount: 8721,
    rating: 4.8,
    difficulty: 'beginner' as const,
    instructorName: 'Дмитрий Фастинг',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    category: 'Здоровье',
  },
]

const categories = ['Все', 'Здоровье', 'Еда']
const difficulties = ['Все уровни', 'Начинающий', 'Средний', 'Продвинутый']

export default function CoursesPage() {
  // Простая страница курсов без фильтров, как в HTML версии
  const filteredCourses = allCourses

  return (
    <main className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Каталог <span className="gradient-text">курсов</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Кето-диета и интервальное голодание — найди идеальный курс для своего здоровья
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden btn-secondary flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Фильтры
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-4">
              {/* Category Select */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input appearance-none pr-10 min-w-[180px] cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-dark-800">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>

              {/* Difficulty Select */}
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="input appearance-none pr-10 min-w-[180px] cursor-pointer"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff} className="bg-dark-800">
                      {diff}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 p-4 glass rounded-xl space-y-4"
            >
              <div>
                <label className="block text-sm text-white/60 mb-2">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-accent-teal text-dark-900'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Уровень</label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-accent-teal text-dark-900'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-white/60"
        >
          Найдено курсов: <span className="text-white font-semibold">{filteredCourses.length}</span>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} {...course} index={index} />
          ))}
        </div>
      </div>
    </main>
  )
}

