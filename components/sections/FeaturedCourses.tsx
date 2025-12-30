'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import { CourseCard } from '@/components/ui/CourseCard'
import { Button } from '@/components/ui/Button'
import { COURSE_IDS } from '@/lib/constants'

// Демо данные для курсов (15% бесплатно, полный доступ 19₽ - ТЕСТ)
const featuredCourses = [
  {
    id: COURSE_IDS.KETO,
    title: 'Кето-диета: полное руководство для начинающих',
    shortDescription: 'Изучи основы кето-диеты, научись правильно рассчитывать макросы и составлять меню. Начни свой путь к здоровью!',
    imageUrl: '/img/keto_course.png',
    price: 19,
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
    id: COURSE_IDS.INTERVAL,
    title: 'Интервальное голодание 16/8',
    shortDescription: 'Освой метод интервального голодания 16/8. Узнай, как правильно голодать и получать максимальную пользу для здоровья.',
    imageUrl: '/img/interval_course.png',
    price: 19,
    originalPrice: null,
    duration: 960,
    studentsCount: 8721,
    rating: 4.8,
    difficulty: 'intermediate' as const,
    instructorName: 'Дмитрий Фастинг',
    instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    category: 'Здоровье',
  },
  {
    id: '3',
    title: 'Кето-рецепты: готовим вкусно и полезно',
    shortDescription: 'Более 100 рецептов кето-блюд: от завтраков до десертов. Научись готовить низкоуглеводные блюда, которые понравятся всей семье.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    price: 19,
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
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    price: 19,
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
    imageUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
    price: 19,
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
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800',
    price: 19,
    originalPrice: null,
    duration: 1080,
    studentsCount: 6543,
    rating: 4.9,
    difficulty: 'beginner' as const,
    instructorName: 'Елена Сладкая',
    instructorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    category: 'Еда',
  },
]

export function FeaturedCourses() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-teal/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent-teal" />
              </div>
              <span className="text-accent-teal font-medium">Популярные курсы</span>
            </div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Выбор наших <span className="gradient-text">студентов</span>
            </h2>
            <p className="text-white/60 text-lg max-w-xl">
              Самые востребованные курсы с высоким рейтингом и отличными отзывами
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/courses">
              <Button variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Все курсы
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredCourses.map((course, index) => (
            <CourseCard key={course.id} {...course} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

