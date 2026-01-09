'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Loader2, BookOpen, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  
  const courseId = searchParams.get('course')
  const type = searchParams.get('type') || 'course_purchase'
  const paymentId = searchParams.get('payment_id')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем статус платежа в БД
    const verifyPayment = async () => {
      try {
        if (!courseId && !paymentId) {
          // Если нет параметров - показываем ошибку
          setStatus('error')
          return
        }

        // Проверяем статус платежа через API
        const params = new URLSearchParams()
        if (paymentId) params.append('payment_id', paymentId)
        if (courseId) params.append('course_id', courseId)

        const response = await fetch(`/api/payments/verify?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          console.error('Payment verification failed:', data)
          setStatus('error')
          return
        }

        // Проверяем реальный статус из БД
        if (data.verified && data.status === 'completed') {
          // Платеж успешно обработан
          setStatus('success')
        } else {
          // Платеж не прошел или еще обрабатывается
          console.log('Payment not completed:', data)
          if (data.status === 'pending') {
            // Платеж еще обрабатывается - ждем немного и проверяем снова
            setTimeout(() => {
              verifyPayment()
            }, 3000)
            return
          }
          setErrorMessage(data.message || 'Платеж не был завершен успешно')
          setStatus('error')
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setStatus('error')
      }
    }

    verifyPayment()
  }, [paymentId, courseId])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-accent-electric animate-spin mx-auto mb-6" />
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Проверяем оплату...
          </h1>
          <p className="text-white/60">Пожалуйста, подождите</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-4">
            Оплата не прошла
          </h1>
          <p className="text-white/60 mb-4">
            {errorMessage || 'К сожалению, оплата не была завершена успешно. Это может произойти по разным причинам.'}
          </p>
          <div className="glass rounded-xl p-4 mb-6 text-left">
            <p className="text-white/80 text-sm mb-2">Что можно сделать:</p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-accent-electric mt-1">•</span>
                <span>Попробуйте другой способ оплаты (СБП, карта, СберПей)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-electric mt-1">•</span>
                <span>Проверьте баланс карты или счета</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-electric mt-1">•</span>
                <span>Попробуйте позже — иногда требуется время для обработки</span>
              </li>
            </ul>
          </div>
          <p className="text-white/40 text-xs mb-8">
            Приносим извинения за неудобства. Если проблема повторяется, обратитесь в поддержку.
          </p>
          <div className="space-y-3">
            {courseId && (
              <Link href={`/courses/${courseId}`} className="w-full">
                <Button className="w-full">Попробовать другой способ оплаты</Button>
              </Link>
            )}
            <Link href="/courses" className="w-full">
              <Button variant="secondary" className="w-full">Вернуться к курсам</Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="secondary" className="w-full">На главную</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
          className="relative w-32 h-32 mx-auto mb-8"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-neon to-accent-mint opacity-20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-accent-neon to-accent-mint flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-dark-900" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display font-bold text-3xl sm:text-4xl text-white mb-4"
        >
          {type === 'balance_topup' ? 'Баланс пополнен!' : 'Оплата прошла успешно!'}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-lg mb-8"
        >
          {type === 'balance_topup'
            ? 'Средства зачислены на ваш баланс. Теперь вы можете использовать их для покупки курсов.'
            : 'Спасибо за покупку! Теперь у вас есть полный доступ к курсу.'}
        </motion.p>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 mb-8 text-left"
        >
          <h3 className="font-semibold text-white mb-3">Что дальше?</h3>
          <ul className="space-y-3">
            {type === 'balance_topup' ? (
              <>
                <li className="flex items-start gap-3 text-white/70">
                  <Wallet className="w-5 h-5 text-accent-electric flex-shrink-0 mt-0.5" />
                  <span>Проверьте баланс в профиле</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <BookOpen className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                  <span>Выберите курс и начните обучение</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-3 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                  <span>Доступ к курсу уже активирован</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <BookOpen className="w-5 h-5 text-accent-electric flex-shrink-0 mt-0.5" />
                  <span>Все уроки доступны в разделе "Мои курсы"</span>
                </li>
                <li className="flex items-start gap-3 text-white/70">
                  <span className="text-lg flex-shrink-0">🎁</span>
                  <span>Бонусные материалы уже ждут вас!</span>
                </li>
              </>
            )}
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {type === 'balance_topup' ? (
            <>
              <Link href="/courses" className="w-full block">
                <Button size="lg" className="w-full">
                  Выбрать курс
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/profile" className="w-full block">
                <Button variant="secondary" size="lg" className="w-full">Перейти в профиль</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href={courseId ? `/courses/${courseId}` : '/profile'} className="w-full block">
                <Button size="lg" className="w-full">
                  Начать обучение
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/profile" className="w-full block">
                <Button variant="secondary" size="lg" className="w-full">Мои курсы</Button>
              </Link>
            </>
          )}
        </motion.div>

        {/* Confetti effect placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-6xl"
        >
          🎉
        </motion.div>
      </motion.div>
    </main>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-accent-electric animate-spin" />
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}

