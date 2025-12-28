'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseCard } from '@/components/ui/CourseCard'
import { ChefHat, Download, Star, ArrowRight, Gift, Zap, BookOpen } from 'lucide-react'

// Все курсы: 15% бесплатно, полный доступ за 1500₽
// Только 2 курса как в HTML версии
const allCourses = [
  {
    id: '1',
    title: 'Кето Диета: Наука Жиросжигания. От Мифов к Результатам',
    shortDescription: 'Изучи основы кето-диеты, научись правильно рассчитывать макросы и составлять меню. Начни свой путь к здоровью и стройности!',
    imageUrl: '/keto_course.png',
    price: 1499,
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
    price: 1499,
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

export default function CoursesPage() {
  return (
    <main className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 mb-6">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Скидка 70%</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Все курсы
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Выбери курс и начни обучение. <span className="text-emerald-400 font-semibold">15% контента бесплатно</span>, полный доступ за <span className="text-emerald-400 font-bold">1499₽</span>
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          <div className="glass rounded-2xl p-6 text-center border border-emerald-400/20">
            <Gift className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">15% бесплатно</h3>
            <p className="text-white/60 text-sm">Попробуй перед покупкой</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center border border-accent-gold/20">
            <Star className="w-10 h-10 text-accent-gold mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">4.9 рейтинг</h3>
            <p className="text-white/60 text-sm">70+ положительных отзывов</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center border border-accent-electric/20">
            <BookOpen className="w-10 h-10 text-accent-electric mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">Пожизненный доступ</h3>
            <p className="text-white/60 text-sm">Учись в своём темпе</p>
          </div>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6 mb-16 max-w-4xl mx-auto">
          {allCourses.map((course, index) => (
            <CourseCard key={course.id} {...course} index={index} />
          ))}
        </div>

        {/* Keto Recipes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden border-2 border-accent-gold/30">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 via-transparent to-emerald-500/10" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gold/20 border border-accent-gold/30 mb-4">
                  <ChefHat className="w-5 h-5 text-accent-gold" />
                  <span className="text-accent-gold font-semibold">Бонус к курсу</span>
                </div>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
                  🥑 100+ Кето-рецептов
                </h2>
                <p className="text-white/70 text-lg mb-6">
                  Вкусные и простые рецепты для кето-диеты: завтраки, обеды, ужины, перекусы и десерты. 
                  С расчётом КБЖУ и возможностью скачать PDF!
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                  <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">🌅 Завтраки</span>
                  <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">🍽️ Обеды</span>
                  <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">🌙 Ужины</span>
                  <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">🥜 Перекусы</span>
                  <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">🍰 Десерты</span>
                </div>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link
                    href="/keto-food"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-gold to-amber-400 text-dark-900 font-bold hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all text-lg"
                  >
                    Смотреть рецепты
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="/files/keto_products_guide.pdf"
                    download
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white font-bold hover:border-accent-gold/50 hover:bg-accent-gold/10 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Скачать PDF гайд
                  </a>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/30 to-emerald-500/30 rounded-3xl blur-3xl" />
                  <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-accent-gold/20 to-emerald-500/20 border border-white/10 flex items-center justify-center">
                    <span className="text-[120px]">🥗</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="glass rounded-3xl p-8 md:p-12 border-2 border-emerald-400/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10" />
            <div className="relative z-10">
              <h2 className="font-display font-bold text-3xl text-white mb-4">
                🔥 Не упусти свой шанс!
              </h2>
              <p className="text-white/60 mb-2 text-lg">
                Скидка <span className="text-red-400 font-bold">70%</span> действует ограниченное время
              </p>
              <p className="text-white/40 mb-8">
                Более 21 000 студентов уже изменили свою жизнь
              </p>
              <div className="inline-flex items-baseline gap-3 mb-6">
                <span className="text-white/40 line-through text-2xl">4 999₽</span>
                <span className="font-display font-black text-5xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">1 499₽</span>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
