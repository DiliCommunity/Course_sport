'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { ArrowLeft, BookOpen, Play, Clock, CheckCircle2, ArrowRight, Lock, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { KETO_COURSE_UUID, INTERVAL_COURSE_UUID } from '@/lib/constants'

interface Course {
  id: string
  title: string
  image_url: string
  short_description?: string
  price: number
  duration_minutes: number
  rating: number
  students_count: number
  lessons_count?: number
}

interface Enrollment {
  id: string
  progress: number
  completed_at: string | null
  courses: Course
}

// Все доступные курсы
const ALL_COURSES: Course[] = [
  {
    id: KETO_COURSE_UUID,
    title: 'Кето Диета: Наука Жиросжигания',
    short_description: 'Изучи основы кето-диеты, научись правильно рассчитывать макросы и составлять меню!',
    image_url: '/img/keto_course.png',
    price: 1,
    duration_minutes: 1200,
    rating: 4.9,
    students_count: 12453,
    lessons_count: 48
  },
  {
    id: INTERVAL_COURSE_UUID,
    title: 'Интервальное Голодание: Здоровье и Энергия',
    short_description: 'Освой метод интервального голодания 16/8 для здоровья и похудения!',
    image_url: '/img/interval_course.png',
    price: 1,
    duration_minutes: 960,
    rating: 4.8,
    students_count: 8721,
    lessons_count: 36
  }
]

export default function MyCoursesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    fetchCourses()
  }, [authLoading, user])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/data', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      const admin = data.user?.is_admin === true || data.user?.username === 'admini_mini'
      setIsAdmin(admin)
      setEnrollments(data.enrollments || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  // Получаем ID купленных курсов
  const purchasedCourseIds = enrollments.map(e => e.courses?.id)
  
  // Курсы которые НЕ куплены
  const notPurchasedCourses = ALL_COURSES.filter(c => !purchasedCourseIds.includes(c.id))

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка курсов...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад в профиль</span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-dark-900" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-white">Мои курсы</h1>
              <p className="text-white/60">
                {isAdmin ? 'Админ-доступ ко всем курсам' : `${enrollments.length} курсов куплено`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Purchased Courses */}
        {enrollments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent-mint" />
              Купленные курсы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Link href={`/courses/${enrollment.courses?.id}`}>
                    <div className="group relative overflow-hidden rounded-2xl glass border border-accent-teal/30 hover:border-accent-teal/60 transition-all">
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        <Image
                          src={enrollment.courses?.image_url || '/img/keto_course.png'}
                          alt={enrollment.courses?.title || 'Курс'}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
                        
                        {/* Progress Badge */}
                        <div className="absolute top-3 right-3">
                          {enrollment.progress === 100 ? (
                            <span className="px-3 py-1 rounded-full bg-accent-mint/20 text-accent-mint text-sm font-medium border border-accent-mint/30">
                              ✓ Завершён
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-accent-gold/20 text-accent-gold text-sm font-medium border border-accent-gold/30">
                              {enrollment.progress}% пройдено
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-display font-bold text-lg text-white group-hover:text-accent-teal transition-colors mb-2 line-clamp-2">
                          {enrollment.courses?.title || 'Без названия'}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.floor((enrollment.courses?.duration_minutes || 0) / 60)}ч
                          </div>
                          <div className="flex items-center gap-1">
                            <span>⭐</span>
                            {(enrollment.courses?.rating || 0).toFixed(1)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-teal to-accent-mint"
                            initial={{ width: 0 }}
                            animate={{ width: `${enrollment.progress}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/50">
                            {enrollment.progress}% завершено
                          </span>
                          <motion.div
                            className="w-10 h-10 rounded-xl bg-accent-teal flex items-center justify-center text-dark-900 shadow-lg shadow-accent-teal/30"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Not Purchased Courses */}
        {notPurchasedCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-white/40" />
              Доступные курсы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notPurchasedCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Link href={`/courses/${course.id}`}>
                    <div className="group relative overflow-hidden rounded-2xl glass border border-white/10 hover:border-white/30 transition-all opacity-70 hover:opacity-100">
                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        <Image
                          src={course.image_url}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/70 to-transparent" />
                        
                        {/* Lock Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-dark-900/80 flex items-center justify-center border border-white/20">
                            <Lock className="w-8 h-8 text-white/60" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-display font-bold text-lg text-white/80 group-hover:text-white transition-colors mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="text-sm text-white/50 mb-4 line-clamp-2">
                          {course.short_description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {Math.floor(course.duration_minutes / 60)}ч
                            </div>
                            <div className="flex items-center gap-1">
                              <span>⭐</span>
                              {course.rating.toFixed(1)}
                            </div>
                          </div>
                          <span className="text-accent-mint font-bold">
                            {course.price.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {enrollments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-white/30" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">У вас пока нет курсов</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Выберите курс и начните свой путь к здоровому образу жизни уже сегодня!
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold text-lg shadow-lg shadow-accent-teal/30 hover:shadow-accent-teal/50 transition-all"
            >
              Выбрать курс
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  )
}

