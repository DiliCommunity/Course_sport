'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { CourseCard } from '@/components/ui/CourseCard'
import { Button } from '@/components/ui/Button'

// Все курсы: 15% бесплатно, полный доступ за 1500₽
const allCourses = [
  {
    id: '1',
    title: 'Кето Диета: Наука Жиросжигания. От Мифов к Результатам',
    shortDescription: 'Изучи основы кето-диеты, научись правильно рассчитывать макросы и составлять меню. Начни свой путь к здоровью и стройности!',
    imageUrl: '/keto_course.png',
    price: 1500,
    originalPrice: null,
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
    originalPrice: null,
    duration: 960,
    studentsCount: 8721,
    rating: 4.8,
    difficulty: 'beginner' as const,
    instructorName: 'Дмитрий Фастинг',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    category: 'Здоровье',
  },
  {
    id: '3',
    title: 'Кето-рецепты: готовим вкусно и полезно',
    shortDescription: 'Более 100 рецептов кето-блюд: от завтраков до десертов. Научись готовить низкоуглеводные блюда, которые понравятся всей семье.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 1800,
    studentsCount: 5432,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Мария Кетова',
    instructorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    category: 'Еда',
  },
  {
    id: '4',
    title: 'Продвинутое интервальное голодание',
    shortDescription: 'Изучи продвинутые протоколы интервального голодания: 18/6, 20/4, OMAD и длительные голодания. Для опытных практиков.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 1440,
    studentsCount: 7856,
    rating: 4.7,
    difficulty: 'advanced' as const,
    instructorName: 'Ольга Голодова',
    instructorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
    category: 'Здоровье',
  },
  {
    id: '5',
    title: 'Кето + интервальное голодание: двойной эффект',
    shortDescription: 'Комбинируй кето-диету с интервальным голоданием для максимальных результатов. Программа трансформации на 30 дней.',
    imageUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 2160,
    studentsCount: 9234,
    rating: 4.8,
    difficulty: 'intermediate' as const,
    instructorName: 'Максим Здоров',
    instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    category: 'Здоровье',
  },
  {
    id: '6',
    title: 'Кето-выпечка и десерты без сахара',
    shortDescription: 'Научись готовить вкусные кето-десерты и выпечку без сахара и муки. Более 50 рецептов сладостей для кето-диеты.',
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 1080,
    studentsCount: 6543,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Елена Сладкая',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    category: 'Еда',
  },
  {
    id: '7',
    title: 'Кето для веганов и вегетарианцев',
    shortDescription: 'Адаптируй кето-диету под растительное питание. Полное руководство по веганской и вегетарианской кето-диете.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 1320,
    studentsCount: 3456,
    rating: 4.6,
    difficulty: 'intermediate' as const,
    instructorName: 'Виктория Зеленая',
    instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    category: 'Еда',
  },
  {
    id: '8',
    title: 'Интервальное голодание для женщин',
    shortDescription: 'Специальный курс по интервальному голоданию с учётом женской физиологии. Безопасные протоколы и рекомендации.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 900,
    studentsCount: 9876,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Анна Здоровьева',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    category: 'Здоровье',
  },
  {
    id: '9',
    title: 'Кето-меню на неделю: планирование питания',
    shortDescription: 'Научись составлять сбалансированное кето-меню на неделю. Планирование, покупки и приготовление блюд.',
    imageUrl: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800&q=80',
    price: 1500,
    originalPrice: null,
    duration: 720,
    studentsCount: 5678,
    rating: 4.7,
    difficulty: 'beginner' as const,
    instructorName: 'Мария Кетова',
    instructorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    category: 'Еда',
  },
]

const categories = ['Все', 'Здоровье', 'Еда']
const difficulties = ['Все уровни', 'Начинающий', 'Средний', 'Продвинутый']

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Все')
  const [selectedDifficulty, setSelectedDifficulty] = useState('Все уровни')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Все' || course.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'Все уровни' ||
      (selectedDifficulty === 'Начинающий' && course.difficulty === 'beginner') ||
      (selectedDifficulty === 'Средний' && course.difficulty === 'intermediate') ||
      (selectedDifficulty === 'Продвинутый' && course.difficulty === 'advanced')
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

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
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredCourses.map((course, index) => (
              <CourseCard key={course.id} {...course} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">
              Курсы не найдены
            </h3>
            <p className="text-white/60 mb-6">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Все')
                setSelectedDifficulty('Все уровни')
              }}
            >
              Сбросить фильтры
            </Button>
          </motion.div>
        )}
      </div>
    </main>
  )
}

