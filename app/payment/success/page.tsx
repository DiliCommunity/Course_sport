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

  useEffect(() => {
    // Проверяем статус платежа
    const verifyPayment = async () => {
      try {
        // Здесь можно добавить проверку статуса через API
        // Пока просто показываем успех
        await new Promise(resolve => setTimeout(resolve, 1500))
        setStatus('success')
      } catch (error) {
        console.error('Payment verification error:', error)
        setStatus('error')
      }
    }

    verifyPayment()
  }, [paymentId])

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
            Ошибка оплаты
          </h1>
          <p className="text-white/60 mb-8">
            Произошла ошибка при обработке платежа. Пожалуйста, попробуйте снова или обратитесь в поддержку.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/payment">Попробовать снова</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/">На главную</Link>
            </Button>
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
              <Button asChild size="lg" className="w-full">
                <Link href="/courses">
                  Выбрать курс
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href="/profile">Перейти в профиль</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="w-full">
                <Link href={courseId ? `/courses/${courseId}` : '/profile'}>
                  Начать обучение
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href="/profile">Мои курсы</Link>
              </Button>
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

