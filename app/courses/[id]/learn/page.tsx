'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  ArrowLeft, Play, CheckCircle2, Lock, BookOpen, 
  Clock, FileText, Video, Image as ImageIcon, ChevronRight,
  Loader2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getCourseUUID } from '@/lib/constants'

interface Lesson {
  id: string
  title: string
  order_index: number
  is_free: boolean
  type: 'video' | 'text' | 'infographic'
  duration_minutes?: number
  content?: string
  module_number?: number
}

interface Module {
  id: number
  title: string
  lessons: Lesson[]
}

interface ProgressData {
  completedLessons: string[]
  overallProgress: number
  enrollment?: {
    progress: number
  }
}

export default function LearnCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [progress, setProgress] = useState<ProgressData>({ completedLessons: [], overallProgress: 0 })
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    checkAccessAndLoadCourse()
  }, [user, params.id])

  const checkAccessAndLoadCourse = async () => {
    try {
      setLoading(true)
      
      // Проверяем доступ
      const accessResponse = await fetch(`/api/courses/access?course_id=${params.id}`, {
        credentials: 'include'
      })
      const accessData = await accessResponse.json()
      
      if (!accessData.hasAccess) {
        router.push(`/courses/${params.id}`)
        return
      }
      
      setHasAccess(true)
      
      // Загружаем уроки
      await loadLessons()
      
      // Загружаем прогресс
      await loadProgress()
      
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLessons = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}/lessons`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load lessons')
      }
      
      const data = await response.json()
      setLessons(data.lessons || [])
      
      // Группируем по модулям
      const modulesMap = new Map<number, Module>()
      
      data.lessons?.forEach((lesson: Lesson) => {
        const moduleNum = lesson.module_number || 1
        if (!modulesMap.has(moduleNum)) {
          modulesMap.set(moduleNum, {
            id: moduleNum,
            title: `Модуль ${moduleNum}`,
            lessons: []
          })
        }
        modulesMap.get(moduleNum)!.lessons.push(lesson)
      })
      
      setModules(Array.from(modulesMap.values()))
      
    } catch (error) {
      console.error('Error loading lessons:', error)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}/progress`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProgress(data)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/courses/${params.id}/lessons/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Обновляем локальный прогресс
        setProgress(prev => ({
          ...prev,
          completedLessons: [...prev.completedLessons, lessonId],
          overallProgress: prev.overallProgress + 1
        }))
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка курса...</p>
        </div>
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-accent-flame mx-auto mb-4" />
          <p className="text-white text-xl mb-4">Доступ к курсу ограничен</p>
          <Link 
            href={`/courses/${params.id}`}
            className="text-accent-teal hover:underline"
          >
            Вернуться к курсу
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href={`/courses/${params.id}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсу</span>
          </Link>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-3xl text-white mb-2">
                Прохождение курса
              </h1>
              <div className="flex items-center gap-4 text-white/60">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{lessons.length} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-mint" />
                  <span>{progress.completedLessons.length} завершено</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round((progress.completedLessons.length / lessons.length) * 100) || 0}%
              </div>
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-teal to-accent-mint"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.completedLessons.length / lessons.length) * 100 || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modules */}
        <div className="space-y-8">
          {modules.map((module, moduleIndex) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: moduleIndex * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="font-display font-bold text-2xl text-white mb-4">
                {module.title}
              </h2>
              
              <div className="space-y-3">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isCompleted = progress.completedLessons.includes(lesson.id)
                  const isLocked = !lesson.is_free && !hasAccess
                  
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (moduleIndex * 0.1) + (lessonIndex * 0.05) }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-accent-mint/10 border-accent-mint/30'
                          : isLocked
                          ? 'bg-white/5 border-white/10 opacity-60'
                          : 'bg-white/5 border-white/10 hover:border-accent-teal/30 hover:bg-white/10'
                      }`}
                      onClick={() => !isLocked && setCurrentLesson(lesson)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-accent-mint/20 text-accent-mint'
                            : isLocked
                            ? 'bg-white/5 text-white/30'
                            : 'bg-accent-teal/20 text-accent-teal'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white/40 text-sm">
                              Урок {lessonIndex + 1}
                            </span>
                            {lesson.is_free && (
                              <span className="px-2 py-0.5 rounded text-xs bg-accent-neon/20 text-accent-neon border border-accent-neon/30">
                                Бесплатно
                              </span>
                            )}
                          </div>
                          <h3 className="text-white font-medium">{lesson.title}</h3>
                          {lesson.duration_minutes && (
                            <div className="flex items-center gap-1 text-white/50 text-sm mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.duration_minutes} мин</span>
                            </div>
                          )}
                        </div>
                        
                        {!isLocked && (
                          <ChevronRight className="w-5 h-5 text-white/40" />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Lesson Modal */}
      {currentLesson && (
        <LessonModal
          lesson={currentLesson}
          isCompleted={progress.completedLessons.includes(currentLesson.id)}
          onClose={() => setCurrentLesson(null)}
          onComplete={() => markLessonComplete(currentLesson.id)}
        />
      )}
    </main>
  )
}

function LessonModal({ 
  lesson, 
  isCompleted, 
  onClose, 
  onComplete 
}: { 
  lesson: Lesson
  isCompleted: boolean
  onClose: () => void
  onComplete: () => void
}) {
  return (
    <div className="fixed inset-0 bg-dark-900/95 z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
          
          {isCompleted && (
            <span className="px-4 py-2 rounded-xl bg-accent-mint/20 text-accent-mint border border-accent-mint/30">
              ✓ Завершено
            </span>
          )}
        </div>
        
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display font-bold text-3xl text-white mb-4">
            {lesson.title}
          </h1>
          
          <div className="prose prose-invert max-w-none text-white/80 mb-8">
            {lesson.content ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <p>Контент урока загружается...</p>
            )}
          </div>
          
          {!isCompleted && (
            <button
              onClick={() => {
                onComplete()
                onClose()
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
            >
              Отметить как завершенное
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

