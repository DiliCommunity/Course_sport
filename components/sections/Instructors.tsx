'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { InstructorCard } from '@/components/ui/InstructorCard'
import { Button } from '@/components/ui/Button'

const instructors = [
  {
    id: '1',
    name: 'Алексей Морозов',
    bio: 'Мастер спорта по фитнесу, сертифицированный тренер с 15-летним стажем. Помог более 10 000 людей достичь своих целей.',
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    specialization: 'Фитнес и силовой тренинг',
    experienceYears: 15,
    studentsCount: 12453,
    coursesCount: 8,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Елена Соколова',
    bio: 'Инструктор йоги международного класса, практикует более 20 лет. Обучалась в Индии у мастеров Аштанга-йоги.',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    specialization: 'Йога и медитация',
    experienceYears: 20,
    studentsCount: 8721,
    coursesCount: 6,
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Дмитрий Волков',
    bio: 'Чемпион России по боксу, тренер сборной. Готовит спортсменов к профессиональным соревнованиям.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    specialization: 'Бокс и единоборства',
    experienceYears: 18,
    studentsCount: 5432,
    coursesCount: 4,
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Марина Петрова',
    bio: 'Сертифицированный CrossFit Level 3 тренер. Призёр международных соревнований по кроссфиту.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    specialization: 'Кроссфит',
    experienceYears: 10,
    studentsCount: 7856,
    coursesCount: 5,
    rating: 4.7,
  },
]

export function Instructors() {
  return (
    <section className="relative py-24 overflow-hidden bg-dark-800/30">
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-mint/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent-mint" />
              </div>
              <span className="text-accent-mint font-medium">Эксперты</span>
            </div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Лучшие <span className="gradient-text">эксперты</span>
            </h2>
            <p className="text-white/60 text-lg max-w-xl">
              Учись у профессионалов с мировым именем и многолетним опытом
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/instructors">
              <Button variant="secondary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Все тренеры
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.map((instructor, index) => (
            <InstructorCard key={instructor.id} {...instructor} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

