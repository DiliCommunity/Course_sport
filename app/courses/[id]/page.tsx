'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Play, Clock, Users, Star, Award, CheckCircle2, 
  BookOpen, Download, MessageCircle, ChevronRight,
  Lock, PlayCircle, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDuration } from '@/lib/utils'

// Демо данные курса (15% уроков бесплатно, полный доступ 1500₽)
const courseData = {
  id: '1',
  title: 'Полный курс фитнеса для начинающих',
  description: `Добро пожаловать в самый полный и эффективный курс фитнеса для начинающих! 

Этот курс создан специально для тех, кто хочет начать свой путь к здоровому и красивому телу, но не знает с чего начать. Я, Алексей Морозов, профессиональный фитнес-тренер с 15-летним опытом, проведу вас через каждый этап вашей трансформации.

В курсе вы узнаете:
• Как правильно выполнять базовые упражнения без риска травм
• Принципы построения эффективной программы тренировок
• Основы питания для достижения ваших целей
• Секреты мотивации и регулярности тренировок

🎁 **15% курса доступно бесплатно!** Попробуйте первые уроки и убедитесь в качестве.

Независимо от вашего текущего уровня подготовки, этот курс поможет вам построить прочный фундамент для дальнейшего развития.`,
  shortDescription: 'Научись правильно тренироваться с нуля. Базовые упражнения, техника и программа тренировок.',
  imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200',
  price: 1500,
  originalPrice: null,
  duration: 1200,
  studentsCount: 12453,
  rating: 4.9,
  reviewsCount: 2847,
  difficulty: 'beginner' as const,
  instructor: {
    id: '1',
    name: 'Алексей Морозов',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    specialization: 'Фитнес и силовой тренинг',
    studentsCount: 12453,
    rating: 4.9,
  },
  category: 'Фитнес',
  lessonsCount: 48,
  freeLessonsCount: 7, // 15% от 48 = ~7 уроков
  features: [
    '48 видеоуроков в HD качестве',
    '🎁 7 уроков бесплатно (15%)',
    'Пожизненный доступ к материалам',
    'Программа тренировок на 12 недель',
    'Гайд по питанию',
    'Чат с тренером',
    'Сертификат об окончании',
  ],
  lessons: [
    // Первые 15% бесплатные (7 из 48)
    { id: '1', title: 'Введение в курс', duration: 15, isFree: true },
    { id: '2', title: 'Основы анатомии для фитнеса', duration: 25, isFree: true },
    { id: '3', title: 'Разминка: почему это важно', duration: 20, isFree: true },
    { id: '4', title: 'Базовые упражнения: приседания', duration: 30, isFree: true },
    { id: '5', title: 'Базовые упражнения: отжимания', duration: 25, isFree: true },
    { id: '6', title: 'Базовые упражнения: подтягивания', duration: 28, isFree: true },
    { id: '7', title: 'Основы дыхания при тренировках', duration: 18, isFree: true },
    // Платные уроки
    { id: '8', title: 'Кардио тренировки дома', duration: 35, isFree: false },
    { id: '9', title: 'Силовые упражнения с весом тела', duration: 40, isFree: false },
    { id: '10', title: 'Растяжка после тренировки', duration: 20, isFree: false },
  ],
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const discount = courseData.originalPrice 
    ? Math.round((1 - courseData.price / courseData.originalPrice) * 100) 
    : 0

  return (
    <main className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-800/50 to-dark-900" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/60 mb-8"
          >
            <Link href="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/courses" className="hover:text-white transition-colors">Курсы</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{courseData.category}</span>
          </motion.nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Video Preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video rounded-2xl overflow-hidden group"
              >
                <Image
                  src={courseData.imageUrl}
                  alt={courseData.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-dark-900/40 group-hover:bg-dark-900/30 transition-colors" />
                <motion.button
                  className="absolute inset-0 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-20 h-20 rounded-full bg-accent-electric flex items-center justify-center shadow-lg shadow-accent-electric/30">
                    <Play className="w-8 h-8 text-dark-900 ml-1" fill="currentColor" />
                  </div>
                </motion.button>
                
                {/* Duration badge */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg glass text-sm">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatDuration(courseData.duration)}
                  </span>
                </div>
              </motion.div>

              {/* Title & Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="badge badge-electric">{courseData.category}</span>
                  <span className="badge badge-neon">Начинающий</span>
                </div>
                
                <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
                  {courseData.title}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-accent-gold fill-accent-gold" />
                    <span className="text-white font-semibold">{courseData.rating}</span>
                    <span>({courseData.reviewsCount} отзывов)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-5 h-5" />
                    <span>{courseData.studentsCount.toLocaleString('ru-RU')} студентов</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5" />
                    <span>{courseData.lessonsCount} уроков</span>
                  </div>
                </div>
              </motion.div>

              {/* Instructor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link href={`/instructors/${courseData.instructor.id}`} className="inline-flex items-center gap-4 p-4 rounded-xl glass hover:bg-white/10 transition-colors">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-accent-electric/30">
                    <Image
                      src={courseData.instructor.avatar}
                      alt={courseData.instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-white/60">Инструктор</div>
                    <div className="font-semibold text-white">{courseData.instructor.name}</div>
                    <div className="text-sm text-accent-electric">{courseData.instructor.specialization}</div>
                  </div>
                </Link>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h2 className="font-display font-bold text-2xl text-white">О курсе</h2>
                <div className="prose prose-invert prose-lg max-w-none">
                  {courseData.description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-white/70 leading-relaxed whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>

              {/* Lessons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <h2 className="font-display font-bold text-2xl text-white">
                  Содержание курса
                </h2>
                <div className="card divide-y divide-white/5">
                  {courseData.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        lesson.isFree 
                          ? 'bg-accent-neon/20 text-accent-neon' 
                          : 'bg-white/5 text-white/40'
                      }`}>
                        {lesson.isFree ? (
                          <PlayCircle className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-sm">{index + 1}.</span>
                          <span className="text-white font-medium">{lesson.title}</span>
                          {lesson.isFree && (
                            <span className="badge badge-neon text-xs">Бесплатно</span>
                          )}
                        </div>
                      </div>
                      <span className="text-white/50 text-sm">
                        {formatDuration(lesson.duration)}
                      </span>
                    </div>
                  ))}
                  <div className="p-4 text-center">
                    <span className="text-white/50">
                      + ещё {courseData.lessonsCount - courseData.lessons.length} уроков
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-28"
              >
                <div className="card p-6 space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-display font-bold text-4xl text-white">
                        {formatPrice(courseData.price)}
                      </span>
                      {courseData.originalPrice && (
                        <span className="text-xl text-white/40 line-through">
                          {formatPrice(courseData.originalPrice)}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="badge badge-flame">Скидка {discount}%</span>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button className="w-full" size="lg">
                      Купить курс
                    </Button>
                    <Button variant="secondary" className="w-full" size="lg">
                      Попробовать бесплатно
                    </Button>
                  </div>

                  {/* Free Preview Badge */}
                  <div className="p-4 rounded-xl bg-accent-neon/10 border border-accent-neon/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-neon/20 flex items-center justify-center">
                        <span className="text-lg">🎁</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">15% курса бесплатно!</div>
                        <div className="text-sm text-white/60">
                          {courseData.freeLessonsCount} уроков доступны без оплаты
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 pt-6 border-t border-white/10">
                    <h3 className="font-semibold text-white">Что включено:</h3>
                    {courseData.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                        <span className="text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Guarantee */}
                  <div className="p-4 rounded-xl bg-accent-electric/10 border border-accent-electric/20">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-accent-electric" />
                      <div>
                        <div className="font-semibold text-white">Гарантия возврата</div>
                        <div className="text-sm text-white/60">14 дней на возврат денег</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

