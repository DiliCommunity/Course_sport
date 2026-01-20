'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  ArrowLeft, Play, CheckCircle2, Lock, BookOpen, 
  Clock, FileText, Sparkles, Image as ImageIcon, ChevronRight,
  Loader2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { getCourseUUID } from '@/lib/constants'
import { MacroCalculator } from '@/components/lessons/MacroCalculator'
import { MealPlanner } from '@/components/lessons/MealPlanner'
import { KetoFluCalculator } from '@/components/lessons/KetoFluCalculator'
import { ShoppingListGenerator } from '@/components/lessons/ShoppingListGenerator'
import { MealGenerator } from '@/components/lessons/MealGenerator'
import { IFCalculator } from '@/components/lessons/IFCalculator'
import { AcneRecipeGenerator } from '@/components/lessons/AcneRecipeGenerator'
import { IFProtocolPlanner } from '@/components/lessons/IFProtocolPlanner'
import { HungerTracker } from '@/components/lessons/HungerTracker'
import { IFProgressTracker } from '@/components/lessons/IFProgressTracker'
import { FastingWorkoutGenerator } from '@/components/lessons/FastingWorkoutGenerator'
import { KetoRecipeGenerator } from '@/components/lessons/KetoRecipeGenerator'
import { ProgressNotesTracker } from '@/components/lessons/ProgressNotesTracker'

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
  const { user, loading: authLoading } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [progress, setProgress] = useState<ProgressData>({ completedLessons: [], overallProgress: 0 })
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const hasScrolledRef = useRef(false)

  useEffect(() => {
    // Ждем окончания загрузки аутентификации
    if (authLoading) {
      return
    }
    
    // Если пользователь не авторизован после загрузки - редирект на логин
    if (!user) {
      router.push('/login')
      return
    }
    
    checkAccessAndLoadCourse()
  }, [user, authLoading, params.id])

  const checkAccessAndLoadCourse = async () => {
    try {
      setPageLoading(true)
      
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
      
      // Загружаем уроки и прогресс параллельно
      await Promise.all([
        loadLessons(),
        loadProgress()
      ])
      
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const loadLessons = async () => {
    try {
      // Используем статический endpoint (модули 2-4 всегда статические)
      const response = await fetch(`/api/courses/${params.id}/lessons-modules24-static`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load lessons')
      }
      
      const data = await response.json()
      
      console.log('Loaded modules 2-4 data:', {
        modulesCount: data.modules?.length,
        lessonsCount: data.lessons?.length
      })
      
      // Если API вернул готовые модули (предпочтительно)
      if (data.modules && data.modules.length > 0) {
        const allLessons: Lesson[] = []
        data.modules.forEach((module: any) => {
          module.lessons.forEach((l: any) => {
            allLessons.push({
              id: l.id,
              title: l.title,
              order_index: l.order_index || 0,
              is_free: l.is_free || false,
              type: (l.type as 'video' | 'text' | 'infographic') || 'text',
              duration_minutes: l.duration_minutes,
              content: l.content || '',
              module_number: l.module_number || module.id
            })
          })
        })
        
        setLessons(allLessons)
        setModules(data.modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l: any) => ({
            id: l.id,
            title: l.title,
            order_index: l.order_index || 0,
            is_free: l.is_free || false,
            type: (l.type as 'video' | 'text' | 'infographic') || 'text',
            duration_minutes: l.duration_minutes,
            content: l.content || '',
            module_number: l.module_number || m.id
          }))
        })))
        return
      }
      
      // Fallback: если модули не вернулись, используем lessons и группируем
      const allLessons = data.lessons || []
      
      if (allLessons.length === 0) {
        console.warn('No lessons found - showing empty state')
        setLessons([])
        setModules([])
        return
      }
      
      // Группируем по модулям
      const modulesMap = new Map<number, Module>()
      
      allLessons.forEach((lesson: any) => {
        const moduleNum = lesson.module_number || 2
        if (!modulesMap.has(moduleNum)) {
          modulesMap.set(moduleNum, {
            id: moduleNum,
            title: `Модуль ${moduleNum}`,
            lessons: []
          })
        }
        modulesMap.get(moduleNum)!.lessons.push({
          id: lesson.id,
          title: lesson.title,
          order_index: lesson.order_index || 0,
          is_free: lesson.is_free || false,
          type: (lesson.type as 'video' | 'text' | 'infographic') || 'text',
          duration_minutes: lesson.duration_minutes,
          content: lesson.content || lesson.description || '',
          module_number: moduleNum
        })
      })
      
      setLessons(allLessons)
      const sortedModules = Array.from(modulesMap.values()).sort((a, b) => a.id - b.id)
      setModules(sortedModules)
      
    } catch (error) {
      console.error('Error loading lessons:', error)
      setLessons([])
      setModules([])
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

  // Находим следующий незавершенный урок для автоматической прокрутки
  useEffect(() => {
    // Прокручиваем только один раз при первой загрузке
    if (hasScrolledRef.current || modules.length === 0 || !progress.completedLessons || lessons.length === 0) {
      return
    }
    
    // Ищем первый незавершенный урок в модулях 2-4
    let nextLesson: Lesson | null = null
    
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (!progress.completedLessons.includes(lesson.id)) {
          nextLesson = lesson
          break
        }
      }
      if (nextLesson) break
    }
    
    // Если все уроки завершены, показываем последний
    if (!nextLesson && modules.length > 0) {
      const lastModule = modules[modules.length - 1]
      if (lastModule.lessons.length > 0) {
        nextLesson = lastModule.lessons[lastModule.lessons.length - 1]
      }
    }
    
    // Прокручиваем к следующему уроку после небольшой задержки
    if (nextLesson && !hasScrolledRef.current) {
      hasScrolledRef.current = true
      setTimeout(() => {
        const element = document.getElementById(`lesson-${nextLesson!.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Добавляем эффект подсветки
          element.classList.add('ring-2', 'ring-accent-teal', 'ring-opacity-50', 'shadow-lg', 'shadow-accent-teal/30')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-accent-teal', 'ring-opacity-50', 'shadow-lg', 'shadow-accent-teal/30')
          }, 3000)
        }
      }, 500)
    }
  }, [modules, progress.completedLessons, lessons])

  const markLessonComplete = async (lessonId: string) => {
    try {
      console.log('[Learn] Marking lesson as complete:', lessonId)
      
      const response = await fetch(`/api/courses/${params.id}/lessons/${lessonId}/complete`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Learn] Failed to mark lesson complete:', errorData)
        throw new Error(errorData.error || 'Failed to mark lesson complete')
      }
      
      const data = await response.json()
      console.log('[Learn] Lesson marked complete. New progress:', data.progress)
      
      // Оптимистично обновляем локальное состояние сразу
      setProgress(prev => ({
        ...prev,
        completedLessons: [...(prev.completedLessons || []), lessonId],
        overallProgress: data.progress || prev.overallProgress
      }))
      
      // Затем перезагружаем из API для синхронизации
      await loadProgress()
      
      console.log('[Learn] Progress reloaded from API')
    } catch (error) {
      console.error('[Learn] Error marking lesson complete:', error)
      // Показываем ошибку пользователю
      alert('Не удалось отметить урок как завершенный. Попробуйте еще раз.')
    }
  }

  // Показываем загрузку пока проверяется авторизация или загружается курс
  if (authLoading || pageLoading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка курса...</p>
        </div>
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
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
    <main className="min-h-screen pt-20 pb-16">
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
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">
                Модули 2-4: Основная программа
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-white/60 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{lessons.length || 0} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-mint" />
                  <span>{progress.completedLessons?.filter(id => lessons.some(l => l.id === id)).length || 0} завершено</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-2xl font-bold text-white mb-1">
                {(() => {
                  const completedInModules24 = progress.completedLessons?.filter(id => 
                    lessons.some(l => l.id === id)
                  ).length || 0
                  return lessons.length > 0 
                    ? Math.round((completedInModules24 / lessons.length) * 100)
                    : 0
                })()}%
              </div>
              <div className="w-full sm:w-48 h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-teal to-accent-mint"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(() => {
                      const completedInModules24 = progress.completedLessons?.filter(id => 
                        lessons.some(l => l.id === id)
                      ).length || 0
                      return lessons.length > 0 
                        ? (completedInModules24 / lessons.length) * 100
                        : 0
                    })()}%` 
                  }}
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
                  const isCompleted = progress.completedLessons?.includes(lesson.id) || false
                  const isLocked = !lesson.is_free && !hasAccess
                  
                  return (
                    <motion.div
                      key={lesson.id}
                      id={`lesson-${lesson.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (moduleIndex * 0.1) + (lessonIndex * 0.05) }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-accent-mint/10 border-accent-mint/30'
                          : isLocked
                          ? 'bg-white/5 border-white/10 opacity-60'
                          : !progress.completedLessons?.includes(lesson.id) && lessonIndex === 0 && moduleIndex === 0
                          ? 'bg-accent-teal/10 border-accent-teal/40 ring-2 ring-accent-teal/30'
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

        {/* CTA для финальных модулей если прогресс >= 70% - в конце после всех уроков */}
        {(() => {
          const completedInModules24 = progress.completedLessons?.filter(id => 
            lessons.some(l => l.id === id)
          ).length || 0
          const progressPercent = lessons.length > 0 
            ? Math.round((completedInModules24 / lessons.length) * 100)
            : 0
          
          if (progressPercent >= 70) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-accent-gold/20 to-accent-electric/20 border-2 border-accent-gold/40"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      🎉 Поздравляем! Вы прошли {progressPercent}% модулей 2-4
                    </h3>
                    <p className="text-white/70">
                      Теперь вы можете получить доступ к финальным модулям 5-6
                    </p>
                  </div>
                  <Link href={`/courses/${params.id}/final`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Перейти к финальным модулям
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )
          }
          return null
        })()}

        {/* Трекер с заметками и мотивациями */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <ProgressNotesTracker courseId={params.id} />
        </motion.div>

        {/* AI Instructor Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Link href="/instructor">
            <div className="rounded-2xl glass border border-white/10 p-6 bg-gradient-to-r from-accent-teal/10 to-accent-mint/10 hover:from-accent-teal/20 hover:to-accent-mint/20 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent-teal to-accent-mint flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-dark-900" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white mb-1">Мой инструктор</h3>
                  <p className="text-white/70 text-sm">
                    Получите персональные рекомендации и ответы на вопросы от AI-инструктора по кето-диете и интервальному голоданию
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-accent-teal flex-shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
      
      {/* Lesson Modal */}
      {currentLesson && (
        <LessonModal
          lesson={currentLesson}
          isCompleted={progress.completedLessons?.includes(currentLesson.id) || false}
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
  // Добавляем/удаляем класс modal-open к body для скрытия Header
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-dark-900/95 z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="glass rounded-2xl p-8 relative">
          {/* Кнопка назад в верхней части контента */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all hover:scale-105 active:scale-95 z-10"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к урокам</span>
            </button>
            
            {isCompleted && (
              <span className="px-4 py-2 rounded-xl bg-accent-mint/20 text-accent-mint border border-accent-mint/30 font-medium">
                ✓ Завершено
              </span>
            )}
          </div>
          
          <h1 className="font-display font-bold text-3xl text-white mb-4">
            {lesson.title}
          </h1>
          
          {lesson.duration_minutes && (
            <div className="flex items-center gap-2 text-white/60 mb-6">
              <Clock className="w-5 h-5" />
              <span>{lesson.duration_minutes} минут</span>
            </div>
          )}
          
          <div className="prose prose-invert max-w-none text-white/80 mb-8">
            {lesson.content ? (
              <div className="whitespace-pre-line">
                {lesson.content.split('\n\n').map((paragraph: string, pIndex: number) => {
                  const parts: (string | JSX.Element)[] = []
                  let lastIndex = 0
                  const boldRegex = /\*\*(.*?)\*\*/g
                  let match
                  
                  while ((match = boldRegex.exec(paragraph)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(paragraph.slice(lastIndex, match.index))
                    }
                    parts.push(<strong key={`bold-${pIndex}-${match.index}`} className="text-white font-semibold">{match[1]}</strong>)
                    lastIndex = match.index + match[0].length
                  }
                  if (lastIndex < paragraph.length) {
                    parts.push(paragraph.slice(lastIndex))
                  }
                  
                  return (
                    <p key={pIndex} className="mb-4 leading-relaxed">
                      {parts.length > 0 ? parts : paragraph}
                    </p>
                  )
                })}
              </div>
            ) : (
              <p className="text-white/60">Контент урока загружается...</p>
            )}
          </div>

          {/* Интерактивные мини-приложения для уроков */}
          {lesson.title.toLowerCase().includes('макрос') || 
           lesson.title.toLowerCase().includes('расчет') ||
           lesson.content?.toLowerCase().includes('формула расчета') ? (
            <MacroCalculator />
          ) : null}

          {lesson.title.toLowerCase().includes('план питания') || 
           lesson.title.toLowerCase().includes('питание на') ||
           lesson.content?.toLowerCase().includes('план питания') ? (
            <MealPlanner />
          ) : null}

          {(lesson.title.toLowerCase().includes('кетогрипп') || 
           lesson.title.toLowerCase().includes('первая неделя') ||
           lesson.title.toLowerCase().includes('пережить первую') ||
           lesson.title.toLowerCase().includes('борьба с кетогриппом') ||
           (lesson.content?.toLowerCase().includes('кетогрипп') && 
            !lesson.title.toLowerCase().includes('тренировк') &&
            !lesson.content?.toLowerCase().includes('тренировк'))) ? (
            <KetoFluCalculator />
          ) : null}

          {(lesson.title.toLowerCase().includes('обед') && 
            lesson.title.toLowerCase().includes('ужин')) ||
           (lesson.title.toLowerCase().includes('обед') && 
            !lesson.title.toLowerCase().includes('завтрак')) ||
           (lesson.title.toLowerCase().includes('ужин') && 
            !lesson.title.toLowerCase().includes('завтрак')) ? (
            <MealGenerator />
          ) : null}

          {(lesson.title.toLowerCase().includes('рецепт') || 
           lesson.title.toLowerCase().includes('завтрак') ||
           lesson.content?.toLowerCase().includes('список покупок') ||
           lesson.content?.toLowerCase().includes('ингредиент')) &&
           !lesson.title.toLowerCase().includes('обед') &&
           !lesson.title.toLowerCase().includes('ужин') ? (
            <ShoppingListGenerator />
          ) : null}

          {lesson.title.toLowerCase().includes('интервальное') || 
           lesson.title.toLowerCase().includes('голодание') ||
           lesson.title.toLowerCase().includes('if') ||
           lesson.content?.toLowerCase().includes('интервальное голодание') ||
           lesson.content?.toLowerCase().includes('16:8') ||
           lesson.content?.toLowerCase().includes('18:6') ? (
            <IFCalculator />
          ) : null}

          {(lesson.title.toLowerCase().includes('протокол') ||
            lesson.title.toLowerCase().includes('автофагия') ||
            lesson.content?.toLowerCase().includes('протокол') ||
            lesson.content?.toLowerCase().includes('автофагия') ||
            lesson.content?.toLowerCase().includes('клеточное обновление')) ? (
            <IFProtocolPlanner />
          ) : null}

          {(lesson.title.toLowerCase().includes('голод') ||
            lesson.title.toLowerCase().includes('борьба с голодом') ||
            lesson.content?.toLowerCase().includes('физический голод') ||
            lesson.content?.toLowerCase().includes('психологический голод') ||
            lesson.content?.toLowerCase().includes('виды голода')) ? (
            <HungerTracker />
          ) : null}

          {(lesson.title.toLowerCase().includes('прогресс') ||
            lesson.title.toLowerCase().includes('трекер') ||
            lesson.title.toLowerCase().includes('отслеживание') ||
            lesson.content?.toLowerCase().includes('отслеживайте прогресс') ||
            lesson.content?.toLowerCase().includes('трекер прогресса') ||
            lesson.content?.toLowerCase().includes('90-дневный план')) ? (
            <IFProgressTracker />
          ) : null}

          {(lesson.title.toLowerCase().includes('тренировка') ||
            lesson.title.toLowerCase().includes('тренировки') ||
            lesson.title.toLowerCase().includes('натощак') ||
            lesson.content?.toLowerCase().includes('тренировки натощак') ||
            lesson.content?.toLowerCase().includes('тренировка натощак') ||
            lesson.content?.toLowerCase().includes('физическая активность') ||
            lesson.content?.toLowerCase().includes('спорт при if') ||
            lesson.content?.toLowerCase().includes('упражнения при голодании')) ? (
            <FastingWorkoutGenerator />
          ) : null}

          {(lesson.title.toLowerCase().includes('завтрак') ||
            lesson.title.toLowerCase().includes('завтраки') ||
            lesson.content?.toLowerCase().includes('кето-завтраки') ||
            lesson.content?.toLowerCase().includes('15 рецептов на каждый день')) && (
            <KetoRecipeGenerator type="breakfast" />
          )}

          {(lesson.title.toLowerCase().includes('десерт') ||
            lesson.title.toLowerCase().includes('десерты') ||
            lesson.content?.toLowerCase().includes('кето-десерты') ||
            lesson.content?.toLowerCase().includes('сладкие кето-десерты')) && (
            <KetoRecipeGenerator />
          )}

          {lesson.title.toLowerCase().includes('акне') ||
           lesson.title.toLowerCase().includes('кето при акне') ||
           lesson.content?.toLowerCase().includes('акне') ||
           lesson.content?.toLowerCase().includes('проблемная кожа') ||
           lesson.content?.toLowerCase().includes('чистая кожа') ? (
            <AcneRecipeGenerator />
          ) : null}
          
          {/* Кнопка назад внизу для удобства */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к урокам</span>
            </button>
            
            {!isCompleted && (
              <button
                onClick={() => {
                  onComplete()
                  onClose()
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
              >
                Отметить как завершенное
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

