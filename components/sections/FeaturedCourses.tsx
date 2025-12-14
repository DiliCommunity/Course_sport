'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import { CourseCard } from '@/components/ui/CourseCard'
import { Button } from '@/components/ui/Button'

// Демо данные для курсов (15% бесплатно, полный доступ 1500₽)
const featuredCourses = [
  {
    id: '1',
    title: 'Полный курс фитнеса для начинающих',
    shortDescription: 'Научись правильно тренироваться с нуля. Базовые упражнения, техника и программа тренировок.',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    price: 1500,
    originalPrice: null,
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
    price: 1500,
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
    price: 1500,
    originalPrice: null,
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
    price: 1500,
    originalPrice: null,
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
    price: 1500,
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
    price: 1500,
    originalPrice: null,
    duration: 2160,
    studentsCount: 6543,
    rating: 4.9,
    difficulty: 'advanced' as const,
    instructorName: 'Максим Громов',
    instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    category: 'Силовой тренинг',
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
              <div className="w-10 h-10 rounded-xl bg-accent-flame/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent-flame" />
              </div>
              <span className="text-accent-flame font-medium">Популярные курсы</span>
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

