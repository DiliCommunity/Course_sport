'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Check, X, Loader2, Sparkles } from 'lucide-react'

interface AppliedPromocode {
  id: string
  code: string
  discountPercent: number
  discountAmount: number
  description: string | null
  promoType?: string
  referralCommission?: number
}

interface PromocodeSectionProps {
  onPromocodeApplied?: (promocode: AppliedPromocode) => void
  onReferralActivated?: () => void
}

export function PromocodeSection({ onPromocodeApplied, onReferralActivated }: PromocodeSectionProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [appliedPromocode, setAppliedPromocode] = useState<AppliedPromocode | null>(null)
  const [isReferralPromo, setIsReferralPromo] = useState(false)

  const handleApplyPromocode = async () => {
    if (!code.trim()) {
      setError('Введите промокод')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/promocodes/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при применении промокода')
        return
      }

      setSuccess(data.message)
      setAppliedPromocode(data.promocode)
      
      // Сохраняем промокод в localStorage для использования при оплате
      if (data.promocode && data.promoType !== 'referral_access') {
        try {
          localStorage.setItem('applied_promocode', JSON.stringify(data.promocode))
        } catch (e) {
          console.error('Error saving promocode to localStorage:', e)
        }
      }
      
      // Проверяем, был ли это промокод для реферальной системы
      if (data.promoType === 'referral_access') {
        setIsReferralPromo(true)
        // Удаляем промокод из localStorage, так как это не скидочный промокод
        localStorage.removeItem('applied_promocode')
        // Вызываем callback для обновления страницы
        if (onReferralActivated) {
          setTimeout(() => {
            onReferralActivated()
          }, 1500) // Небольшая задержка чтобы пользователь увидел сообщение
        }
      }
      
      if (onPromocodeApplied && data.promocode) {
        onPromocodeApplied(data.promocode)
      }

    } catch (err) {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearPromocode = () => {
    setAppliedPromocode(null)
    setCode('')
    setSuccess(null)
    setError(null)
    // Удаляем промокод из localStorage
    localStorage.removeItem('applied_promocode')
  }

  const formatDiscount = (promocode: AppliedPromocode) => {
    if (promocode.discountPercent > 0) {
      return `-${promocode.discountPercent}%`
    }
    if (promocode.discountAmount > 0) {
      return `-${(promocode.discountAmount / 100).toLocaleString('ru-RU')} ₽`
    }
    return 'Скидка'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass border border-white/10 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-flame to-accent-gold flex items-center justify-center">
          <Ticket className="w-5 h-5 text-dark-900" />
        </div>
        <div>
          <h3 className="font-bold text-white">Промокод</h3>
          <p className="text-sm text-white/60">Введите промокод для получения скидки</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {appliedPromocode ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 p-4"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-white">
                      {appliedPromocode.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                      {formatDiscount(appliedPromocode)}
                    </span>
                  </div>
                  {appliedPromocode.description && (
                    <p className="text-sm text-white/60 mt-1">{appliedPromocode.description}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleClearPromocode}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Удалить промокод"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
              <Sparkles className="w-4 h-4" />
              <span>
                {isReferralPromo 
                  ? '🎉 Реферальная система активирована! Страница обновится...'
                  : 'Промокод применён! Скидка будет учтена при оплате'
                }
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromocode()}
                placeholder="Введите промокод"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-flame/50 font-mono uppercase tracking-wider"
                disabled={loading}
              />
              <button
                onClick={handleApplyPromocode}
                disabled={loading || !code.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-flame to-accent-gold text-dark-900 font-bold hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="hidden sm:inline">Применить</span>
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 text-sm text-red-400 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {error}
                </motion.p>
              )}
              {success && !appliedPromocode && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 text-sm text-green-400 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {success}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

