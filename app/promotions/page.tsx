'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Gift, Users, Share2, TrendingUp, ArrowRight, Flame, Star, Zap, X } from 'lucide-react'
import { PaymentModal } from '@/components/ui/PaymentModal'
import { ReferralModal } from '@/components/profile/ReferralModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { COURSE_IDS } from '@/lib/constants'

interface PromotionStatus {
  available: boolean
  usedSlots?: number
  totalSlots?: number
  availableSlots?: number
}

export default function PromotionsPage() {
  const { user } = useAuth()
  const [selectedPromotion, setSelectedPromotion] = useState<string | null>(null)
  const [selectedCourseForPromotion, setSelectedCourseForPromotion] = useState<string>(COURSE_IDS.KETO)
  const [showCourseSelection, setShowCourseSelection] = useState(false)
  const [promotionStatus, setPromotionStatus] = useState<Record<string, PromotionStatus>>({})
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [referralData, setReferralData] = useState<{
    referralCode: string
    hasPurchasedCourse: boolean
    stats: {
      total_referred: number
      total_earned: number
      active_referrals: number
      completed_referrals: number
    }
  }>({
    referralCode: '',
    hasPurchasedCourse: false,
    stats: {
      total_referred: 0,
      total_earned: 0,
      active_referrals: 0,
      completed_referrals: 0
    }
  })
  
  // Загружаем статус акций
  useEffect(() => {
    const checkPromotions = async () => {
      try {
        const response = await fetch('/api/promotions/check?id=first_100')
        if (response.ok) {
          const data = await response.json()
          setPromotionStatus(prev => ({ ...prev, first_100: data }))
        }
      } catch (error) {
        console.error('Error checking promotions:', error)
      }
    }
    checkPromotions()
  }, [])

  // Загружаем данные реферальной программы
  useEffect(() => {
    if (user && isReferralModalOpen) {
      const loadReferralData = async () => {
        try {
          const response = await fetch('/api/profile/data', { credentials: 'include' })
          if (response.ok) {
            const data = await response.json()
            setReferralData({
              referralCode: data.referralCode || '',
              hasPurchasedCourse: data.hasPurchasedCourse || false,
              stats: data.referralStats || {
                total_referred: 0,
                total_earned: 0,
                active_referrals: 0,
                completed_referrals: 0
              }
            })
          }
        } catch (error) {
          console.error('Error loading referral data:', error)
        }
      }
      loadReferralData()
    }
  }, [user, isReferralModalOpen])
  return (
    <main className="min-h-screen pt-20 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-gold/20 border border-accent-gold/30 mb-6">
            <Gift className="w-5 h-5 text-accent-gold" />
            <span className="text-accent-gold font-semibold">Специальные предложения</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            Акции и специальные предложения
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Воспользуйтесь выгодными предложениями и начни обучение со скидкой
          </p>
        </motion.div>
      </section>

      {/* Promotions Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Акция 1: Первым 100 студентам */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative glass rounded-2xl p-6 lg:p-8 border-2 border-accent-gold/30 overflow-hidden hover:scale-[1.02] transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/20 border border-accent-gold/30 mb-4">
                <Star className="w-4 h-4 text-accent-gold" />
                <span className="text-accent-gold font-medium text-sm">Специальное предложение</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">
                Первым 100 студентам
              </h3>
              <p className="text-white/60 mb-4 text-sm">
                Специальная цена для первых 100 студентов! Успей получить курс по выгодной цене.
              </p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-white/40 line-through text-lg">1999₽</span>
                <span className="font-display font-black text-3xl bg-gradient-to-r from-accent-gold to-accent-electric bg-clip-text text-transparent">
                  1099₽
                </span>
              </div>
              <div className="p-3 rounded-xl bg-accent-gold/10 border border-accent-gold/20 mb-6">
                <div className="text-white/60 text-xs mb-1">Осталось мест:</div>
                <div className="text-accent-gold font-bold text-2xl">
                  {promotionStatus.first_100?.availableSlots ?? 100}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    // Redirect to login if not authenticated
                    window.location.href = '/login?redirect=/promotions'
                    return
                  }
                  if (!promotionStatus.first_100?.available) {
                    alert('К сожалению, все места по этой акции уже заняты!')
                    return
                  }
                  // Показываем модалку выбора курса
                  setShowCourseSelection(true)
                }}
                disabled={!promotionStatus.first_100?.available && promotionStatus.first_100 !== undefined}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-gold/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Воспользоваться</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Акция 2: Реферальная программа */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative glass rounded-2xl p-6 lg:p-8 border-2 border-accent-teal/30 overflow-hidden hover:scale-[1.02] transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/20 border border-accent-teal/30 mb-4">
                <TrendingUp className="w-4 h-4 text-accent-teal" />
                <span className="text-accent-teal font-medium text-sm">Реферальная программа</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">
                Заработай: приведи друга и получи 30%
              </h3>
              <p className="text-white/60 mb-4 text-sm">
                Пригласи друга на платформу! Если он купит курс, ты получишь 30% с его покупок на свой счет.
              </p>
              <div className="space-y-3 mb-6">
                <div className="p-3 rounded-xl bg-accent-teal/10 border border-accent-teal/20">
                  <div className="text-white/80 font-medium text-sm mb-2">Как это работает:</div>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-teal mt-0.5">1.</span>
                      <span>Получи свою реферальную ссылку</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-teal mt-0.5">2.</span>
                      <span>Поделись с друзьями</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-teal mt-0.5">3.</span>
                      <span>Получи 30% с каждой покупки друга</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-teal mt-0.5">4.</span>
                      <span>Выводи средства или используй на курсы</span>
                    </li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = '/login?redirect=/promotions'
                    return
                  }
                  setIsReferralModalOpen(true)
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-accent-teal to-accent-electric text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-teal/30 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Получить реферальную ссылку</span>
              </button>
            </div>
          </motion.div>

          {/* Акция 3: 2 курса за 2499₽ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative glass rounded-2xl p-6 lg:p-8 border-2 border-accent-flame/30 overflow-hidden hover:scale-[1.02] transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-flame/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-flame/20 border border-accent-flame/30 mb-4">
                <Flame className="w-4 h-4 text-accent-flame" />
                <span className="text-accent-flame font-medium text-sm">Горячая акция</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">
                2 курса можно купить сразу по цене 2499₽
              </h3>
              <p className="text-white/60 mb-4 text-sm">
                Специальное предложение! Купите курс по Кето-диете и курс по Интервальному голоданию вместе и сэкономьте!
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <img src="/img/keto_course.png" alt="Кето-диета" className="w-full h-24 object-cover rounded-lg" />
                </div>
                <span className="text-2xl text-white/60">+</span>
                <div className="flex-1">
                  <img src="/img/interval_course.png" alt="Интервальное голодание" className="w-full h-24 object-cover rounded-lg" />
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-white/40 line-through text-lg">7898₽</span>
                <span className="font-display font-black text-3xl bg-gradient-to-r from-accent-flame to-accent-gold bg-clip-text text-transparent">
                  2499₽
                </span>
              </div>
              <div className="p-3 rounded-xl bg-accent-flame/10 border border-accent-flame/20 mb-6">
                <div className="text-white/60 text-xs mb-1">Экономия:</div>
                <div className="text-accent-flame font-bold text-xl">5399₽</div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = '/login?redirect=/promotions'
                    return
                  }
                  setSelectedPromotion('two_courses')
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-accent-flame to-accent-gold text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-flame/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Воспользоваться</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 lg:p-8 rounded-2xl glass border border-white/10"
        >
          <h3 className="font-display font-bold text-2xl text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent-electric" />
            Важная информация
          </h3>
          <ul className="space-y-3 text-white/60 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent-electric mt-1">•</span>
              <span>Акции действуют ограниченное время. Успейте воспользоваться предложением!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-electric mt-1">•</span>
              <span>Акция "Первым 100 студентам" действует до окончания мест.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-electric mt-1">•</span>
              <span>Реферальная программа не имеет ограничений по времени. Приглашайте друзей и зарабатывайте!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-electric mt-1">•</span>
              <span>При покупке 2 курсов одновременно вы получаете доступ ко всем материалам обоих курсов.</span>
            </li>
          </ul>
        </motion.div>
      </section>

      {/* Course Selection Modal */}
      {showCourseSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative glass rounded-2xl p-6 lg:p-8 max-w-md w-full border-2 border-accent-gold/30"
          >
            <button
              onClick={() => setShowCourseSelection(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="font-display font-bold text-2xl text-white mb-4">
              Выберите курс
            </h3>
            <p className="text-white/60 mb-6 text-sm">
              Выберите курс, который хотите приобрести по специальной цене 1099₽
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedCourseForPromotion(COURSE_IDS.KETO)
                  setShowCourseSelection(false)
                  setSelectedPromotion('first_100')
                }}
                className="w-full p-4 rounded-xl border-2 border-white/10 hover:border-accent-gold/50 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <img 
                    src="/img/keto_course.png" 
                    alt="Кето-диета" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Кето-диета</div>
                    <div className="text-sm text-white/60">Всё о кето-диете</div>
                    <div className="text-accent-gold font-bold mt-2">1099₽</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedCourseForPromotion(COURSE_IDS.INTERVAL)
                  setShowCourseSelection(false)
                  setSelectedPromotion('first_100')
                }}
                className="w-full p-4 rounded-xl border-2 border-white/10 hover:border-accent-gold/50 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <img 
                    src="/img/interval_course.png" 
                    alt="Интервальное голодание" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Интервальное голодание</div>
                    <div className="text-sm text-white/60">За/Против</div>
                    <div className="text-accent-gold font-bold mt-2">1099₽</div>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modals */}
      {selectedPromotion === 'first_100' && (
        <PaymentModal
          isOpen={true}
          onClose={() => {
            setSelectedPromotion(null)
            // Обновляем статус после закрытия
            fetch('/api/promotions/check?id=first_100')
              .then(res => res.json())
              .then(data => setPromotionStatus(prev => ({ ...prev, first_100: data })))
              .catch(console.error)
          }}
          courseTitle={selectedCourseForPromotion === COURSE_IDS.KETO ? 'Кето-диета (по акции 1099₽)' : 'Интервальное голодание (по акции 1099₽)'}
          coursePrice={109900} // 1099₽ в копейках
          courseId={selectedCourseForPromotion}
          type="promotion"
          promotionId="first_100"
          onPaymentSuccess={() => {
            setSelectedPromotion(null)
            window.location.href = '/courses'
          }}
        />
      )}

      {selectedPromotion === 'two_courses' && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedPromotion(null)}
          courseTitle="2 курса: Кето-диета + Интервальное голодание"
          coursePrice={249900} // 2499₽ в копейках
          type="promotion"
          promotionId="two_courses"
          onPaymentSuccess={() => {
            setSelectedPromotion(null)
            window.location.href = '/profile/courses'
          }}
        />
      )}

      {/* Referral Modal */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        referralCode={referralData.referralCode}
        hasPurchasedCourse={referralData.hasPurchasedCourse}
        stats={referralData.stats}
      />
    </main>
  )
}

