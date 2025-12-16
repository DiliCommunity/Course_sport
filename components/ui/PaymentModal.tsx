'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Lock, CheckCircle2 } from 'lucide-react'
import { Button } from './Button'
import { formatPrice } from '@/lib/utils'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  coursePrice: number
  onPaymentSuccess?: () => void
}

export function PaymentModal({
  isOpen,
  onClose,
  courseTitle,
  coursePrice,
  onPaymentSuccess,
}: PaymentModalProps) {
  const handlePayment = () => {
    // Здесь будет логика оплаты
    // Пока просто закрываем модальное окно
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card max-w-md w-full p-6 space-y-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-teal/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-accent-teal" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-white">
                    Оплата курса
                  </h2>
                </div>
                <p className="text-white/70 text-sm">
                  {courseTitle}
                </p>
              </div>

              {/* Price */}
              <div className="p-4 rounded-xl bg-accent-electric/10 border border-accent-electric/20">
                <div className="flex items-baseline justify-between">
                  <span className="text-white/70">Стоимость курса:</span>
                  <span className="font-display font-bold text-3xl text-white">
                    {formatPrice(coursePrice)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Способ оплаты:</h3>
                <div className="space-y-2">
                  <button className="w-full p-4 rounded-xl glass hover:bg-white/10 transition-colors text-left flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-accent-teal" />
                    <span className="text-white">Банковская карта</span>
                  </button>
                  <button className="w-full p-4 rounded-xl glass hover:bg-white/10 transition-colors text-left flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-accent-neon/20 flex items-center justify-center">
                      <span className="text-xs">💳</span>
                    </div>
                    <span className="text-white">СБП (Система быстрых платежей)</span>
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-neon/10 border border-accent-neon/20">
                <CheckCircle2 className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  <div className="font-semibold text-white mb-1">Безопасная оплата</div>
                  <div>Все платежи защищены шифрованием. Мы не храним данные вашей карты.</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                >
                  Оплатить {formatPrice(coursePrice)}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={onClose}
                >
                  Отмена
                </Button>
              </div>

              {/* Guarantee */}
              <div className="text-center text-xs text-white/50">
                Гарантия возврата денег в течение 14 дней
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

