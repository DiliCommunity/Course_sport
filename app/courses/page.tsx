'use client'

import { motion } from 'framer-motion'
import { CourseCard } from '@/components/ui/CourseCard'

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
        {/* Page Header - как в HTML версии */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Все курсы
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Выбери курс и начни обучение. 15% контента бесплатно, полный доступ за 1499₽
          </p>
        </motion.div>

        {/* Courses Grid - только 2 курса как в HTML */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {allCourses.map((course, index) => (
            <CourseCard key={course.id} {...course} index={index} />
          ))}
        </div>
      </div>
    </main>
  )
}
