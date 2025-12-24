'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatPrice } from '@/lib/utils'

// Платежные методы
const paymentMethods = [
  {
    id: 'sbp',
    name: 'СБП',
    description: 'Система быстрых платежей',
    icon: '💳',
  },
  {
    id: 'card',
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР',
    icon: '💳',
  },
  {
    id: 'sber_pay',
    name: 'СберПей',
    description: 'Оплата через Сбербанк',
    icon: '🏦',
  },
  {
    id: 'tinkoff_pay',
    name: 'Т-Пей',
    description: 'Оплата через Тинькофф',
    icon: '💛',
  },
  {
    id: 'yoomoney',
    name: 'ЮMoney',
    description: 'Электронный кошелек',
    icon: '💜',
  },
]

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const courseId = searchParams.get('course')
  const courseTitle = searchParams.get('title') || 'Курс'
  const coursePrice = parseInt(searchParams.get('price') || '1499')
  const type = searchParams.get('type') || 'course_purchase' // course_purchase или balance_topup
  const amount = searchParams.get('amount') ? parseInt(searchParams.get('amount')!) : coursePrice

  const [selectedMethod, setSelectedMethod] = useState('card')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const userId = user?.id || null

      if (typeof window === 'undefined') {
        throw new Error('Ошибка инициализации')
      }

      const returnUrl = `${window.location.origin}/payment/success?${type === 'course_purchase' ? `course=${courseId}` : 'type=balance_topup'}`

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: type === 'course_purchase' ? courseId : null,
          paymentMethod: selectedMethod,
          amount: amount * 100, // Конвертируем в копейки
          userId: userId,
          type: type,
          returnUrl: returnUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      if (data.confirmationUrl) {
        // Перенаправляем на страницу оплаты ЮКасса
        window.location.href = data.confirmationUrl
      } else {
        throw new Error('Не получена ссылка на оплату')
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка. Попробуйте позже.')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="glass rounded-3xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💳</div>
            <h1 className="font-display font-bold text-3xl text-white mb-2">
              {type === 'balance_topup' ? 'Пополнение баланса' : 'Оплата курса'}
            </h1>
            {type === 'course_purchase' && (
              <p className="text-accent-electric font-semibold text-lg">{courseTitle}</p>
            )}
          </div>

          {/* Price Box */}
          <div className="bg-gradient-to-br from-accent-gold/15 to-accent-electric/15 border border-accent-gold/30 rounded-2xl p-6 text-center mb-8">
            <p className="text-white/60 text-sm mb-2">Сумма к оплате</p>
            <div className="text-5xl font-black bg-gradient-to-r from-accent-gold to-accent-electric bg-clip-text text-transparent mb-2">
              {formatPrice(amount)}
            </div>
            <div className="inline-block bg-accent-flame text-white px-3 py-1 rounded-full text-xs font-bold">
              БЕЗОПАСНО
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h3 className="font-bold text-white mb-4">Способ оплаты:</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    selectedMethod === method.id
                      ? 'bg-accent-electric/20 border-2 border-accent-electric'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl">{method.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">{method.name}</div>
                    <div className="text-sm text-white/60">{method.description}</div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id
                        ? 'bg-accent-electric border-accent-electric'
                        : 'border-white/30'
                    }`}
                  >
                    {selectedMethod === method.id && (
                      <CheckCircle2 className="w-4 h-4 text-dark-900" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full mb-4"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Обработка...
              </>
            ) : (
              <>
                Оплатить {formatPrice(amount)}
                <Lock className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Security Info */}
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <Shield className="w-4 h-4" />
            <span>Безопасная оплата через ЮКассу</span>
          </div>
        </div>
      </motion.div>
    </main>
  )
}

