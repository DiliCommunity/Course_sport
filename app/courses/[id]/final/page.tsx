'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  ArrowLeft, Play, CheckCircle2, Lock, BookOpen, 
  Clock, FileText, Video, Image as ImageIcon, ChevronRight,
  Loader2, AlertCircle, Award
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { PaymentModal } from '@/components/ui/PaymentModal'
import { formatPrice, formatDuration } from '@/lib/utils'
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
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [accessData, setAccessData] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [finalModulesData, setFinalModulesData] = useState<FinalModulesData | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    checkAccess()
    loadFinalModulesData()
  }, [user, params.id])

  const checkAccess = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${params.id}/final-access`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      setHasAccess(data.hasAccess || false)
      setAccessData(data)
      
    } catch (error) {
      console.error('Error checking final access:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFinalModulesData = async () => {
    // Загружаем данные модулей 4 и 5 из курса
    // Это временное решение - можно вынести в API
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка...</p>
        </div>
      </main>
    )
  }

  // Если нет доступа - показываем сообщение о необходимости прогресса
  if (!hasAccess && accessData) {
    return (
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link
              href={`/courses/${params.id}`}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к курсу</span>
            </Link>

            <div className="glass rounded-2xl p-12 border-2 border-accent-gold/30">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Финальные модули (25% курса)
              </h1>
              
              {accessData.reason === 'insufficient_progress' && (
                <>
                  <p className="text-white/60 mb-6">
                    Для доступа к финальным модулям нужно пройти 70% модулей 2-4
                  </p>
                  
                  <div className="bg-white/5 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80">Прогресс модулей 2-4:</span>
                      <span className="text-accent-gold font-bold">
                        {accessData.progress?.percent || 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent-teal to-accent-mint"
                        initial={{ width: 0 }}
                        animate={{ width: `${accessData.progress?.percent || 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-white/50 text-sm mt-2">
                      Завершено: {accessData.progress?.completed || 0} из {accessData.progress?.required || 0} уроков
                    </p>
                  </div>

                  <p className="text-white/40 text-sm mb-6">
                    {accessData.message}
                  </p>

                  <div className="space-y-3">
                    {(accessData.progress?.percent || 0) >= 70 ? (
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => setIsPaymentModalOpen(true)}
                      >
                        Купить финальные модули
                      </Button>
                    ) : (
                      <Link href={`/courses/${params.id}/learn`}>
                        <Button size="lg" className="w-full">
                          Продолжить обучение
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              )}

              {accessData.reason === 'progress_requirement_met' && !accessData.hasFullAccess && (
                <>
                  <p className="text-white/60 mb-6">
                    Поздравляем! Вы прошли 70% модулей 2-4. Теперь вы можете купить финальные модули (25% курса)
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="w-full mb-4"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Купить финальные модули — {formatPrice((accessData.finalPrice || 300) / 100)}
                  </Button>
                </>
              )}
              
              {accessData.reason === 'not_enrolled' && (
                <>
                  <p className="text-white/60 mb-6">
                    Сначала нужно купить курс
                  </p>
                  <Link href={`/courses/${params.id}`}>
                    <Button size="lg" className="w-full">
                      Вернуться к курсу
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  // Если есть доступ - показываем финальные модули
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
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gold/20 text-accent-gold border border-accent-gold/30 mb-4">
              <Award className="w-5 h-5" />
              <span className="font-bold">Финальные модули</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-2">
              Завершение курса
            </h1>
            <p className="text-white/60 text-lg">
              Последние 25% курса — продвинутые техники и трансформация
            </p>
          </div>
        </motion.div>

        {/* Modules 4 and 5 Content */}
        {finalModulesData && (
          <div className="space-y-12">
            {/* Module 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8 border-2 border-accent-gold/30"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">⭐</span>
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">
                    {finalModulesData.module4.moduleTitle}
                  </h2>
                </div>
              </div>

              {finalModulesData.module4.imageUrl && (
                <div className="mb-6">
                  <Image
                    src={finalModulesData.module4.imageUrl}
                    alt={finalModulesData.module4.moduleTitle}
                    width={1200}
                    height={600}
                    className="rounded-xl w-full h-auto object-cover"
                  />
                </div>
              )}

              <div className="space-y-6">
                {finalModulesData.module4.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">⭐</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{lesson.title}</h3>
                        {lesson.duration && (
                          <span className="text-white/60 text-sm flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none text-white/80">
                      {lesson.content.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-4 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {lesson.checklist && lesson.checklist.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
                        <h4 className="text-white font-semibold mb-2">Ваш план действий:</h4>
                        <ul className="space-y-2">
                          {lesson.checklist.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-2 text-white/80">
                              <CheckCircle2 className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lesson.bonus && (
                      <div className="mt-4 p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📋</span>
                          <div>
                            <div className="font-semibold text-white">Бонус: {lesson.bonus.title}</div>
                            <div className="text-sm text-white/60">{lesson.bonus.description}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Module 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-8 border-2 border-accent-neon/30"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-neon to-accent-electric flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🏆</span>
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">
                    {finalModulesData.module5.moduleTitle}
                  </h2>
                </div>
              </div>

              {finalModulesData.module5.imageUrl && (
                <div className="mb-6">
                  <Image
                    src={finalModulesData.module5.imageUrl}
                    alt={finalModulesData.module5.moduleTitle}
                    width={1200}
                    height={600}
                    className="rounded-xl w-full h-auto object-cover"
                  />
                </div>
              )}

              <div className="space-y-6">
                {finalModulesData.module5.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-neon to-accent-electric flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🏆</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{lesson.title}</h3>
                        {lesson.duration && (
                          <span className="text-white/60 text-sm flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none text-white/80">
                      {lesson.content.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-4 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {lesson.checklist && lesson.checklist.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-accent-neon/10 border border-accent-neon/20">
                        <h4 className="text-white font-semibold mb-2">Ваш план действий:</h4>
                        <ul className="space-y-2">
                          {lesson.checklist.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-2 text-white/80">
                              <CheckCircle2 className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lesson.bonus && (
                      <div className="mt-4 p-4 rounded-xl bg-accent-neon/10 border border-accent-neon/20">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📋</span>
                          <div>
                            <div className="font-semibold text-white">Бонус: {lesson.bonus.title}</div>
                            <div className="text-sm text-white/60">{lesson.bonus.description}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-r from-accent-neon/20 via-accent-electric/20 to-accent-gold/20 border-2 border-accent-neon/40"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-accent-neon mb-2">Поздравляем!</h3>
          <p className="text-white/80 text-lg mb-2">Вы завершили весь курс!</p>
          <p className="text-white/60">Теперь у вас есть все знания для успешной трансформации</p>
        </motion.div>
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

