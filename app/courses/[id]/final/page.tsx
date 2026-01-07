'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  ArrowLeft, CheckCircle2, Lock, Clock, FileText, Video, 
  ChevronDown, ChevronUp, Loader2, Award, Sparkles, Star
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { PaymentModal } from '@/components/ui/PaymentModal'
import { formatPrice, formatDuration } from '@/lib/utils'

interface FinalModulesData {
  module4: {
    moduleTitle: string
    lessons: Array<{
      id: string
      title: string
      type: 'video' | 'text' | 'infographic'
      duration?: number
      content: string
      checklist?: string[]
      bonus?: { title: string; type: string; description: string }
    }>
    imageUrl: string
  }
  module5: {
    moduleTitle: string
    lessons: Array<{
      id: string
      title: string
      type: 'video' | 'text' | 'infographic'
      duration?: number
      content: string
      checklist?: string[]
      bonus?: { title: string; type: string; description: string }
    }>
    imageUrl: string
  }
}

export default function FinalModulesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [accessData, setAccessData] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [finalModulesData, setFinalModulesData] = useState<FinalModulesData | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([4, 5]))
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Ждем окончания загрузки аутентификации
    if (authLoading) {
      return
    }
    
    if (!user) {
      router.push('/login')
      return
    }
    
    checkAccess()
    loadFinalModulesData()
  }, [user, authLoading, params.id])

  const checkAccess = async () => {
    try {
      setPageLoading(true)
      const response = await fetch(`/api/courses/${params.id}/final-access`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      setHasAccess(data.hasAccess || false)
      setAccessData(data)
      
      // Если нет доступа и прогресс < 70%, перенаправляем на модули 2-4
      if (!data.hasAccess && data.reason === 'insufficient_progress') {
        router.push(`/courses/${params.id}/learn`)
        return
      }
      
    } catch (error) {
      console.error('Error checking final access:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const loadFinalModulesData = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}/final-modules`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFinalModulesData(data)
      }
    } catch (error) {
      console.error('Error loading final modules data:', error)
    }
  }

  const handlePaymentSuccess = () => {
    checkAccess() // Обновляем доступ после оплаты
  }

  const toggleModule = (moduleNum: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleNum)) {
        newSet.delete(moduleNum)
      } else {
        newSet.add(moduleNum)
      }
      return newSet
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId)
      } else {
        newSet.add(lessonId)
      }
      return newSet
    })
  }

  if (authLoading || pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href={`/courses/${params.id}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 relative z-10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсу</span>
          </Link>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent-gold/20 to-accent-electric/20 text-accent-gold border-2 border-accent-gold/40 mb-4 shadow-lg shadow-accent-gold/20">
              <Award className="w-5 h-5" />
              <span className="font-bold text-lg">Финальные модули</span>
            </div>
            <h1 className="font-display font-bold text-5xl text-white mb-3 bg-gradient-to-r from-white via-accent-gold to-white bg-clip-text text-transparent">
              Завершение курса
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">
              Последние 25% курса — продвинутые техники и полная трансформация
            </p>
          </div>
        </motion.div>

        {/* Payment Block - показываем всегда, если нет доступа */}
        {!hasAccess && accessData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative overflow-hidden"
          >
            <div className="glass rounded-3xl p-8 border-2 border-accent-gold/40 shadow-2xl relative">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/10 via-accent-electric/10 to-accent-gold/10 opacity-50" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center shadow-lg">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          Разблокировать финальные модули
                        </h2>
                        <p className="text-white/60">
                          {accessData.reason === 'insufficient_progress' 
                            ? 'Прогресс: ' + (accessData.progress?.percent || 0) + '% модулей 2-4'
                            : 'Получите доступ к модулям 5-6'}
                        </p>
                      </div>
                    </div>

                    {accessData.reason === 'insufficient_progress' && (
                      <div className="bg-white/10 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/80 font-medium">Прогресс модулей 2-4:</span>
                          <span className="text-accent-gold font-bold text-lg">
                            {accessData.progress?.percent || 0}%
                          </span>
                        </div>
                        <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent-gold to-accent-electric"
                            initial={{ width: 0 }}
                            animate={{ width: `${accessData.progress?.percent || 0}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <p className="text-white/50 text-sm mt-2">
                          Завершено: {accessData.progress?.completed || 0} из {accessData.progress?.required || 0} уроков
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-3xl font-bold text-white mb-1">
                          {formatPrice((accessData.finalPrice || 300) / 100)}
                        </div>
                        <div className="text-white/60 text-sm">
                          Единоразовая оплата • Доступ навсегда
                        </div>
                      </div>
                      
                      {accessData.canPurchase ? (
                        <Button 
                          size="lg"
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          Разблокировать доступ
                        </Button>
                      ) : (
                        <Link href={`/courses/${params.id}/learn`}>
                          <Button 
                            size="lg"
                            variant="secondary"
                            className="px-8 py-4 text-lg"
                          >
                            Продолжить обучение
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Badge - если есть доступ */}
        {hasAccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="glass rounded-2xl p-6 border-2 border-accent-mint/40 bg-gradient-to-r from-accent-mint/10 to-accent-teal/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-mint to-accent-teal flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">✅ Доступ открыт</h3>
                  <p className="text-white/70">Вы можете просматривать все материалы финальных модулей</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modules Content - показываем всегда */}
        {finalModulesData && (
          <div className="space-y-6">
            {/* Module 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl overflow-hidden border-2 border-white/10 shadow-xl"
            >
              {/* Module Header */}
              <button
                onClick={() => toggleModule(4)}
                className="w-full p-6 bg-gradient-to-r from-accent-gold/20 to-accent-electric/20 hover:from-accent-gold/30 hover:to-accent-electric/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center shadow-lg">
                      <Star className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="font-display font-bold text-2xl text-white mb-1">
                        {finalModulesData.module4.moduleTitle}
                      </h2>
                      <p className="text-white/60 text-sm">
                        {finalModulesData.module4.lessons.length} уроков
                      </p>
                    </div>
                  </div>
                  {expandedModules.has(4) ? (
                    <ChevronUp className="w-6 h-6 text-white/60" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white/60" />
                  )}
                </div>
              </button>

              {/* Module Content */}
              <AnimatePresence>
                {expandedModules.has(4) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6">
                      {finalModulesData.module4.imageUrl && (
                        <div className="rounded-2xl overflow-hidden">
                          <Image
                            src={finalModulesData.module4.imageUrl}
                            alt={finalModulesData.module4.moduleTitle}
                            width={1200}
                            height={600}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}

                      {finalModulesData.module4.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className={`rounded-2xl border-2 overflow-hidden transition-all ${
                            hasAccess 
                              ? 'bg-white/5 border-white/10 hover:border-accent-gold/30' 
                              : 'bg-white/5 border-white/10 opacity-60'
                          }`}
                        >
                          <button
                            onClick={() => hasAccess && toggleLesson(lesson.id)}
                            disabled={!hasAccess}
                            className="w-full p-5 text-left hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  hasAccess 
                                    ? 'bg-gradient-to-br from-accent-gold/20 to-accent-electric/20' 
                                    : 'bg-white/5'
                                }`}>
                                  {lesson.type === 'video' ? (
                                    <Video className={`w-6 h-6 ${hasAccess ? 'text-accent-gold' : 'text-white/30'}`} />
                                  ) : (
                                    <FileText className={`w-6 h-6 ${hasAccess ? 'text-accent-gold' : 'text-white/30'}`} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className={`text-lg font-bold mb-2 ${hasAccess ? 'text-white' : 'text-white/40'}`}>
                                    {lesson.title}
                                  </h3>
                                  {lesson.duration && (
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                      <Clock className="w-4 h-4" />
                                      <span>{formatDuration(lesson.duration)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {!hasAccess && (
                                <Lock className="w-5 h-5 text-white/30" />
                              )}
                              {hasAccess && (
                                expandedLessons.has(lesson.id) ? (
                                  <ChevronUp className="w-5 h-5 text-white/60" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-white/60" />
                                )
                              )}
                            </div>
                          </button>

                          {hasAccess && expandedLessons.has(lesson.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-5 pb-5"
                            >
                              <div className="pl-16 pt-4 border-t border-white/10">
                                <div className="prose prose-invert max-w-none text-white/80 whitespace-pre-line">
                                  {lesson.content.split('\n\n').map((paragraph, pIndex) => (
                                    <p key={pIndex} className="mb-4 leading-relaxed">
                                      {paragraph.split('\n').map((line, lIndex) => {
                                        const boldRegex = /\*\*(.*?)\*\*/g
                                        const parts: (string | JSX.Element)[] = []
                                        let lastIndex = 0
                                        let match
                                        
                                        while ((match = boldRegex.exec(line)) !== null) {
                                          if (match.index > lastIndex) {
                                            parts.push(line.slice(lastIndex, match.index))
                                          }
                                          parts.push(<strong key={`bold-${pIndex}-${lIndex}-${match.index}`} className="text-white font-semibold">{match[1]}</strong>)
                                          lastIndex = match.index + match[0].length
                                        }
                                        if (lastIndex < line.length) {
                                          parts.push(line.slice(lastIndex))
                                        }
                                        
                                        return (
                                          <span key={lIndex}>
                                            {parts.length > 0 ? parts : line}
                                            {lIndex < line.split('\n').length - 1 && <br />}
                                          </span>
                                        )
                                      })}
                                    </p>
                                  ))}
                                </div>

                                {lesson.checklist && lesson.checklist.length > 0 && (
                                  <div className="mt-6 p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
                                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-accent-gold" />
                                      Ваш план действий:
                                    </h4>
                                    <ul className="space-y-2">
                                      {lesson.checklist.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start gap-2 text-white/80">
                                          <span className="text-accent-gold mt-1">•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {lesson.bonus && (
                                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-accent-gold/10 to-accent-electric/10 border border-accent-gold/20">
                                    <div className="flex items-center gap-3">
                                      <span className="text-3xl">🎁</span>
                                      <div>
                                        <div className="font-semibold text-white">Бонус: {lesson.bonus.title}</div>
                                        <div className="text-sm text-white/60">{lesson.bonus.description}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Module 5 - аналогично Module 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-3xl overflow-hidden border-2 border-white/10 shadow-xl"
            >
              <button
                onClick={() => toggleModule(5)}
                className="w-full p-6 bg-gradient-to-r from-accent-neon/20 to-accent-electric/20 hover:from-accent-neon/30 hover:to-accent-electric/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-neon to-accent-electric flex items-center justify-center shadow-lg">
                      <Award className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="font-display font-bold text-2xl text-white mb-1">
                        {finalModulesData.module5.moduleTitle}
                      </h2>
                      <p className="text-white/60 text-sm">
                        {finalModulesData.module5.lessons.length} уроков
                      </p>
                    </div>
                  </div>
                  {expandedModules.has(5) ? (
                    <ChevronUp className="w-6 h-6 text-white/60" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-white/60" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedModules.has(5) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6">
                      {finalModulesData.module5.imageUrl && (
                        <div className="rounded-2xl overflow-hidden">
                          <Image
                            src={finalModulesData.module5.imageUrl}
                            alt={finalModulesData.module5.moduleTitle}
                            width={1200}
                            height={600}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}

                      {finalModulesData.module5.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`rounded-2xl border-2 overflow-hidden transition-all ${
                            hasAccess 
                              ? 'bg-white/5 border-white/10 hover:border-accent-neon/30' 
                              : 'bg-white/5 border-white/10 opacity-60'
                          }`}
                        >
                          <button
                            onClick={() => hasAccess && toggleLesson(lesson.id)}
                            disabled={!hasAccess}
                            className="w-full p-5 text-left hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  hasAccess 
                                    ? 'bg-gradient-to-br from-accent-neon/20 to-accent-electric/20' 
                                    : 'bg-white/5'
                                }`}>
                                  {lesson.type === 'video' ? (
                                    <Video className={`w-6 h-6 ${hasAccess ? 'text-accent-neon' : 'text-white/30'}`} />
                                  ) : (
                                    <FileText className={`w-6 h-6 ${hasAccess ? 'text-accent-neon' : 'text-white/30'}`} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className={`text-lg font-bold mb-2 ${hasAccess ? 'text-white' : 'text-white/40'}`}>
                                    {lesson.title}
                                  </h3>
                                  {lesson.duration && (
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                      <Clock className="w-4 h-4" />
                                      <span>{formatDuration(lesson.duration)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {!hasAccess && (
                                <Lock className="w-5 h-5 text-white/30" />
                              )}
                              {hasAccess && (
                                expandedLessons.has(lesson.id) ? (
                                  <ChevronUp className="w-5 h-5 text-white/60" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-white/60" />
                                )
                              )}
                            </div>
                          </button>

                          {hasAccess && expandedLessons.has(lesson.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="px-5 pb-5"
                            >
                              <div className="pl-16 pt-4 border-t border-white/10">
                                <div className="prose prose-invert max-w-none text-white/80 whitespace-pre-line">
                                  {lesson.content.split('\n\n').map((paragraph, pIndex) => (
                                    <p key={pIndex} className="mb-4 leading-relaxed">
                                      {paragraph.split('\n').map((line, lIndex) => {
                                        const boldRegex = /\*\*(.*?)\*\*/g
                                        const parts: (string | JSX.Element)[] = []
                                        let lastIndex = 0
                                        let match
                                        
                                        while ((match = boldRegex.exec(line)) !== null) {
                                          if (match.index > lastIndex) {
                                            parts.push(line.slice(lastIndex, match.index))
                                          }
                                          parts.push(<strong key={`bold-${pIndex}-${lIndex}-${match.index}`} className="text-white font-semibold">{match[1]}</strong>)
                                          lastIndex = match.index + match[0].length
                                        }
                                        if (lastIndex < line.length) {
                                          parts.push(line.slice(lastIndex))
                                        }
                                        
                                        return (
                                          <span key={lIndex}>
                                            {parts.length > 0 ? parts : line}
                                            {lIndex < line.split('\n').length - 1 && <br />}
                                          </span>
                                        )
                                      })}
                                    </p>
                                  ))}
                                </div>

                                {lesson.checklist && lesson.checklist.length > 0 && (
                                  <div className="mt-6 p-4 rounded-xl bg-accent-neon/10 border border-accent-neon/20">
                                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-accent-neon" />
                                      Ваш план действий:
                                    </h4>
                                    <ul className="space-y-2">
                                      {lesson.checklist.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start gap-2 text-white/80">
                                          <span className="text-accent-neon mt-1">•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {lesson.bonus && (
                                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-accent-neon/10 to-accent-electric/10 border border-accent-neon/20">
                                    <div className="flex items-center gap-3">
                                      <span className="text-3xl">🎁</span>
                                      <div>
                                        <div className="font-semibold text-white">Бонус: {lesson.bonus.title}</div>
                                        <div className="text-sm text-white/60">{lesson.bonus.description}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Success Message - только если есть доступ */}
        {hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center p-8 rounded-3xl bg-gradient-to-r from-accent-neon/20 via-accent-electric/20 to-accent-gold/20 border-2 border-accent-neon/40 shadow-2xl"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-white mb-2">Поздравляем!</h3>
            <p className="text-white/80 text-xl mb-2">Вы завершили весь курс!</p>
            <p className="text-white/60">Теперь у вас есть все знания для успешной трансформации</p>
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        courseTitle="Финальные модули (25% курса)"
        coursePrice={(accessData?.finalPrice || 300) / 100}
        courseId={params.id}
        type="final_modules"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  )
}
