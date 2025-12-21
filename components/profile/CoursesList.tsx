'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Clock, CheckCircle2, ArrowRight } from 'lucide-react'

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

interface CoursesListProps {
  enrollments: Enrollment[]
}

export function CoursesList({ enrollments }: CoursesListProps) {
  if (enrollments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 rounded-2xl glass border border-white/10"
      >
        <p className="text-white/60">У вас пока нет купленных курсов</p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
        >
          Выбрать курс
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment, index) => (
        <motion.div
          key={enrollment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/courses/${enrollment.courses.id}`}>
            <div className="group relative overflow-hidden rounded-xl glass border border-white/10 hover:border-accent-teal/30 transition-all">
              <div className="flex gap-4 p-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={enrollment.courses.image_url}
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
  )
}
