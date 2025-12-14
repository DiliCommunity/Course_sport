'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, UtensilsCrossed, ArrowRight, BookOpen, Users } from 'lucide-react'

const categories = [
  {
    id: '1',
    name: 'Здоровье',
    slug: 'health',
    description: 'Кето-диета, интервальное голодание и здоровый образ жизни. Научись правильно заботиться о своём организме.',
    icon: Heart,
    color: 'teal',
    coursesCount: 28,
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
    gradient: 'from-accent-teal/20 via-accent-aqua/10 to-accent-mint/20',
    features: ['Кето-диета', 'Интервальное голодание', 'Здоровый образ жизни'],
  },
  {
    id: '2',
    name: 'Еда',
    slug: 'food',
    description: 'Рецепты кето-блюд, правильное питание и кулинарные мастер-классы. Готовь вкусно и полезно каждый день.',
    icon: UtensilsCrossed,
    color: 'mint',
    coursesCount: 35,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80',
    gradient: 'from-accent-mint/20 via-accent-cream/10 to-accent-teal/20',
    features: ['Кето-рецепты', 'Правильное питание', 'Кулинарные мастер-классы'],
  },
]

export default function CategoriesPage() {
  return (
    <main className="min-h-screen pt-28 pb-16 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-accent-teal/5 to-transparent" />
      <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-t from-accent-mint/5 to-transparent" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Heart className="w-4 h-4 text-accent-teal" />
            <span className="text-sm text-white/80 font-medium">Категории</span>
          </motion.div>
          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-white mb-6">
            Выбери свою <span className="gradient-text">категорию</span>
          </h1>
          <p className="text-white/60 text-xl max-w-3xl mx-auto leading-relaxed">
            Кето-диета, интервальное голодание и здоровое питание — всё для твоего здоровья и благополучия
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <Link href={`/categories/${category.slug}`} className="block group">
                  <motion.div
                    className="relative h-full rounded-3xl overflow-hidden card-hover"
                    whileHover={{ y: -8 }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative p-8 sm:p-10 min-h-[500px] flex flex-col justify-between">
                      {/* Top Section */}
                      <div>
                        {/* Icon */}
                        <motion.div
                          className={`w-16 h-16 rounded-2xl bg-${category.color === 'teal' ? 'accent-teal' : 'accent-mint'}/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <Icon className={`w-8 h-8 ${category.color === 'teal' ? 'text-accent-teal' : 'text-accent-mint'}`} />
                        </motion.div>

                        {/* Category Name */}
                        <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 group-hover:text-accent-teal transition-colors">
                          {category.name}
                        </h2>

                        {/* Description */}
                        <p className="text-white/80 text-lg mb-6 leading-relaxed max-w-md">
                          {category.description}
                        </p>

                        {/* Features */}
                        <div className="flex flex-wrap gap-3 mb-6">
                          {category.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border ${
                                category.color === 'teal'
                                  ? 'bg-accent-teal/20 text-accent-teal border-accent-teal/30'
                                  : 'bg-accent-mint/20 text-accent-mint border-accent-mint/30'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-white/70">
                            <BookOpen className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              {category.coursesCount} {category.coursesCount === 1 ? 'курс' : category.coursesCount < 5 ? 'курса' : 'курсов'}
                            </span>
                          </div>
                        </div>
                        <motion.div
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            category.color === 'teal'
                              ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30 group-hover:bg-accent-teal group-hover:text-dark-900'
                              : 'bg-accent-mint/20 text-accent-mint border border-accent-mint/30 group-hover:bg-accent-mint group-hover:text-dark-900'
                          }`}
                          whileHover={{ x: 5 }}
                        >
                          <span>Смотреть</span>
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl glass">
            <Users className="w-5 h-5 text-accent-teal" />
            <span className="text-white/80">
              Более <span className="text-white font-semibold">63 курсов</span> от лучших экспертов
            </span>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

