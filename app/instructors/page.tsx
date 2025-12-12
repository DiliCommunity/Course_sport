'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { InstructorCard } from '@/components/ui/InstructorCard'

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
  {
    id: '5',
    name: 'Ольга Никитина',
    bio: 'Сертифицированный инструктор по пилатесу и реабилитации. Специализируется на работе со спиной.',
    avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    specialization: 'Пилатес и реабилитация',
    experienceYears: 12,
    studentsCount: 9234,
    coursesCount: 4,
    rating: 4.8,
  },
  {
    id: '6',
    name: 'Максим Громов',
    bio: 'Профессиональный бодибилдер и нутрициолог. Помогает строить идеальное тело через тренировки и питание.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    specialization: 'Силовой тренинг и питание',
    experienceYears: 14,
    studentsCount: 6543,
    coursesCount: 7,
    rating: 4.9,
  },
  {
    id: '7',
    name: 'Виктория Белова',
    bio: 'Фитнес-блогер с аудиторией 2М подписчиков. Специалист по домашним HIIT тренировкам.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    specialization: 'HIIT и кардио',
    experienceYears: 8,
    studentsCount: 11234,
    coursesCount: 5,
    rating: 4.6,
  },
  {
    id: '8',
    name: 'Анастасия Волкова',
    bio: 'Профессиональная гимнастка и тренер по растяжке. Помогает достичь шпагата в любом возрасте.',
    avatarUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
    specialization: 'Растяжка и гибкость',
    experienceYears: 16,
    studentsCount: 8976,
    coursesCount: 3,
    rating: 4.7,
  },
]

export default function InstructorsPage() {
  return (
    <main className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <GraduationCap className="w-4 h-4 text-accent-neon" />
            <span className="text-sm text-white/80">Эксперты</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Наши <span className="gradient-text">тренеры</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Учись у лучших профессионалов с многолетним опытом и тысячами довольных студентов
          </p>
        </motion.div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.map((instructor, index) => (
            <InstructorCard key={instructor.id} {...instructor} index={index} />
          ))}
        </div>
      </div>
    </main>
  )
}

