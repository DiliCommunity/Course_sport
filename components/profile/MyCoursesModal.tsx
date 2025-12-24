'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Play, Clock, CheckCircle2, ArrowRight, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

interface Course {
  id: string
  title: string
  image_url: string
  price: number
  duration_minutes: number
  rating: number
  students_count: number
}

interface Enrollment {
  id: string
  progress: number
  completed_at: string | null
  courses: Course
}

interface MyCoursesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MyCoursesModal({ isOpen, onClose }: MyCoursesModalProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCourses()
    }
  }, [isOpen, user?.id])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/data', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      const admin = data.user?.is_admin === true || data.user?.username === 'admini_mini'
      setIsAdmin(admin)

      if (admin) {
        // Для админа получаем все курсы
        const allCoursesResponse = await fetch('/api/courses', {
          credentials: 'include',
        })
        if (allCoursesResponse.ok) {
          const allCoursesData = await allCoursesResponse.json()
          // Преобразуем курсы в формат enrollments для отображения
          const adminEnrollments = allCoursesData.courses?.map((course: Course) => ({
            id: `admin-${course.id}`,
            progress: 100, // Админ имеет полный доступ
            completed_at: null,
            courses: course,
          })) || []
          setEnrollments(adminEnrollments)
        } else {
          setEnrollments(data.enrollments || [])
        }
      } else {
        setEnrollments(data.enrollments || [])
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-dark-900/90 backdrop-blur-md"
          style={{ zIndex: 9998 }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl glass border border-white/10 overflow-hidden flex flex-col"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-mint/10" />
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-dark-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Мои курсы</h2>
                  <p className="text-sm text-white/60">
                    {isAdmin ? 'Все курсы (админ-доступ)' : 'Ваши купленные курсы'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-white/40" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">У вас пока нет курсов</h3>
                  <p className="text-white/60 mb-6">
                    Выберите курс и начните обучение уже сегодня!
                  </p>
                  <Link
                    href="/courses"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
                  >
                    Выбрать курс
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment, index) => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link 
                        href={`/courses/${enrollment.courses.id}`}
                        onClick={onClose}
                      >
                        <div className="group relative overflow-hidden rounded-xl glass border border-white/10 hover:border-accent-teal/30 transition-all">
                          <div className="flex gap-4 p-4">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={enrollment.courses.image_url || '/keto_course.png'}
                                alt={enrollment.courses.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
                              {enrollment.progress === 100 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-accent-mint/20">
                                  <CheckCircle2 className="w-8 h-8 text-accent-mint" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-bold text-white group-hover:text-accent-teal transition-colors line-clamp-2 mb-2">
                                {enrollment.courses.title}
                              </h4>
                              
                              <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {Math.floor(enrollment.courses.duration_minutes / 60)}ч
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>⭐</span>
                                  {enrollment.courses.rating.toFixed(1)}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-teal to-accent-mint"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${enrollment.progress}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                />
                              </div>
                              <p className="text-xs text-white/50 mt-1">{enrollment.progress}% завершено</p>
                            </div>

                            <div className="flex items-center">
                              <motion.div
                                className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center text-accent-teal group-hover:bg-accent-teal group-hover:text-dark-900 transition-all"
                                whileHover={{ x: 5 }}
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
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-between items-center">
              <p className="text-sm text-white/60">
                Всего курсов: <span className="text-white font-semibold">{enrollments.length}</span>
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

