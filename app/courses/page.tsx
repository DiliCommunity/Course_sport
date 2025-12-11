'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { CourseCard } from '@/components/ui/CourseCard'
import { Button } from '@/components/ui/Button'

const allCourses = [
  {
    id: '1',
    title: 'Полный курс фитнеса для начинающих',
    shortDescription: 'Научись правильно тренироваться с нуля. Базовые упражнения, техника и программа тренировок.',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    price: 4990,
    originalPrice: 7990,
    duration: 1200,
    studentsCount: 12453,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Алексей Морозов',
    instructorAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
    category: 'Фитнес',
  },
  {
    id: '2',
    title: 'Йога для гибкости и баланса',
    shortDescription: 'Развивай гибкость, укрепляй тело и обретай внутреннюю гармонию с древней практикой йоги.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    price: 3990,
    originalPrice: null,
    duration: 960,
    studentsCount: 8721,
    rating: 4.8,
    difficulty: 'intermediate' as const,
    instructorName: 'Елена Соколова',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    category: 'Йога',
  },
  {
    id: '3',
    title: 'Бокс: от новичка до профи',
    shortDescription: 'Освой технику бокса, научись защищаться и атаковать. Полный курс от чемпиона.',
    imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
    price: 6990,
    originalPrice: 9990,
    duration: 1800,
    studentsCount: 5432,
    rating: 4.9,
    difficulty: 'advanced' as const,
    instructorName: 'Дмитрий Волков',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    category: 'Единоборства',
  },
  {
    id: '4',
    title: 'Кроссфит: функциональный тренинг',
    shortDescription: 'Интенсивные тренировки для развития силы, выносливости и скорости одновременно.',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800',
    price: 5490,
    originalPrice: 7490,
    duration: 1440,
    studentsCount: 7856,
    rating: 4.7,
    difficulty: 'intermediate' as const,
    instructorName: 'Марина Петрова',
    instructorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    category: 'Кроссфит',
  },
  {
    id: '5',
    title: 'Пилатес для здоровой спины',
    shortDescription: 'Укрепи мышцы кора и избавься от болей в спине с эффективными упражнениями пилатеса.',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    price: 3490,
    originalPrice: null,
    duration: 720,
    studentsCount: 9234,
    rating: 4.8,
    difficulty: 'beginner' as const,
    instructorName: 'Ольга Никитина',
    instructorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
    category: 'Пилатес',
  },
  {
    id: '6',
    title: 'Силовой тренинг: набор массы',
    shortDescription: 'Научись правильно набирать мышечную массу. Программа тренировок и питания.',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
    price: 5990,
    originalPrice: 8990,
    duration: 2160,
    studentsCount: 6543,
    rating: 4.9,
    difficulty: 'advanced' as const,
    instructorName: 'Максим Громов',
    instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    category: 'Силовой тренинг',
  },
  {
    id: '7',
    title: 'HIIT: высокоинтенсивные тренировки',
    shortDescription: 'Сжигай калории максимально эффективно с короткими, но интенсивными тренировками.',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    price: 2990,
    originalPrice: 4990,
    duration: 600,
    studentsCount: 11234,
    rating: 4.6,
    difficulty: 'intermediate' as const,
    instructorName: 'Виктория Белова',
    instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    category: 'Кардио',
  },
  {
    id: '8',
    title: 'Медитация и осознанность',
    shortDescription: 'Научись управлять своими эмоциями и достигать состояния глубокого покоя.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    price: 1990,
    originalPrice: null,
    duration: 480,
    studentsCount: 15678,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Елена Соколова',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    category: 'Йога',
  },
  {
    id: '9',
    title: 'Растяжка: шпагат за 30 дней',
    shortDescription: 'Пошаговая программа для достижения полного шпагата даже с нулевой гибкостью.',
    imageUrl: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800',
    price: 2490,
    originalPrice: 3990,
    duration: 540,
    studentsCount: 8976,
    rating: 4.7,
    difficulty: 'beginner' as const,
    instructorName: 'Анастасия Волкова',
    instructorAvatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
    category: 'Растяжка',
  },
]

const categories = ['Все', 'Фитнес', 'Йога', 'Единоборства', 'Кроссфит', 'Кардио', 'Пилатес', 'Растяжка']
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
            Найди идеальный курс для своих целей и начни трансформацию уже сегодня
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
                          ? 'bg-accent-electric text-dark-900'
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
                          ? 'bg-accent-electric text-dark-900'
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

