'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, CheckCircle2, Shield, LogIn, Mail, Phone, Tag, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTelegram } from '@/components/providers/TelegramProvider'
import { Button } from './Button'
import { TonPaymentButton } from './TonPaymentButton'
import { formatPrice } from '@/lib/utils'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  coursePrice: number
  courseId?: string
  isFullAccess?: boolean // true = покупка полного доступа (осталось 30%), false = первый раз
  type?: 'course_purchase' | 'final_modules' | 'balance_topup' | 'promotion' // Тип платежа
  promotionId?: string // ID акции (first_100, two_courses)
  onPaymentSuccess?: () => void
}

// Платежные методы с реальными значками
const paymentMethods = [
  {
    id: 'sbp',
    name: 'СБП',
    description: 'Система быстрых платежей',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#1D1346"/>
        <path d="M16 6L8 10.5V21.5L16 26L24 21.5V10.5L16 6Z" fill="url(#sbp_gradient)"/>
        <defs>
          <linearGradient id="sbp_gradient" x1="8" y1="6" x2="24" y2="26">
            <stop stopColor="#5B57A2"/>
            <stop offset="0.5" stopColor="#D90E7A"/>
            <stop offset="1" stopColor="#FAA61A"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'card',
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР',
    icon: (
      <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
        <rect width="40" height="28" rx="4" fill="#1A1A2E"/>
        <rect x="0" y="7" width="40" height="5" fill="#FFD700"/>
        {/* МИР */}
        <circle cx="10" cy="18" r="4" fill="#4DB45E"/>
        {/* Mastercard */}
        <circle cx="22" cy="18" r="4" fill="#EB001B"/>
        <circle cx="26" cy="18" r="4" fill="#F79E1B" fillOpacity="0.8"/>
        {/* Visa */}
        <path d="M32 15L35 21H33L32 15Z" fill="#1A1F71"/>
      </svg>
    )
  },
  {
    id: 'sber_pay',
    name: 'СберПей',
    description: 'Оплата через Сбербанк',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#21A038"/>
        <path d="M16 7C11.03 7 7 11.03 7 16C7 20.97 11.03 25 16 25C20.97 25 25 20.97 25 16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M16 7V16L22 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'yoomoney',
    name: 'ЮMoney',
    description: 'Электронный кошелек',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#8B3FFD"/>
        <circle cx="12" cy="16" r="6" fill="white"/>
        <path d="M18 10L26 16L18 22V10Z" fill="white"/>
      </svg>
    )
  }
]

export function PaymentModal({
  isOpen,
  onClose,
  courseTitle,
  coursePrice,
  courseId,
  isFullAccess = false,
  type = 'course_purchase',
  promotionId,
  onPaymentSuccess,
}: PaymentModalProps) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState('sbp')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [showContactForm, setShowContactForm] = useState(false)
  const { user } = useAuth()
  const { user: telegramUser, isTelegramApp, webApp } = useTelegram()
  
  // Промокоды
  const [promocodeInput, setPromocodeInput] = useState('')
  const [appliedPromocode, setAppliedPromocode] = useState<any>(null)
  const [isValidatingPromocode, setIsValidatingPromocode] = useState(false)
  const [promocodeError, setPromocodeError] = useState<string | null>(null)
  const [finalAmount, setFinalAmount] = useState(coursePrice)
  
  // Проверка авторизации - ТОЛЬКО по наличию сессии (user), не по данным Telegram
  const isAuthenticated = !!user

  // Заполняем email/phone из БД при открытии модалки
  useEffect(() => {
    if (isOpen && user) {
      if (user.email && !email) {
        setEmail(user.email)
      }
      if (user.phone && !phone) {
        setPhone(user.phone)
      }
    }
  }, [isOpen, user])

  // Загружаем примененный промокод из localStorage при открытии модалки
  useEffect(() => {
    if (isOpen && user) {
      try {
        const savedPromocode = localStorage.getItem('applied_promocode')
        if (savedPromocode) {
          const promocode = JSON.parse(savedPromocode)
          // Проверяем, что промокод еще действителен
          if (promocode && promocode.code) {
            setPromocodeInput(promocode.code)
            setAppliedPromocode(promocode)
            // Сразу пересчитываем финальную сумму
            let discount = 0
            if (promocode.discountPercent) {
              discount = Math.round(coursePrice * promocode.discountPercent / 100)
            } else if (promocode.discountAmount) {
              if (promocode.discountAmount < 100) {
                discount = Math.round(promocode.discountAmount * 100)
              } else {
                discount = Math.round(promocode.discountAmount)
              }
            }
            discount = Math.min(discount, coursePrice)
            setFinalAmount(Math.max(0, coursePrice - discount))
          } else {
            setFinalAmount(coursePrice)
          }
        } else {
          setFinalAmount(coursePrice)
        }
      } catch (e) {
        console.error('Error loading promocode from localStorage:', e)
        setFinalAmount(coursePrice)
      }
    } else if (!isOpen) {
      // Сбрасываем при закрытии модалки
      setFinalAmount(coursePrice)
    }
  }, [isOpen, user, coursePrice])

  // Сохраняем примененный промокод в localStorage
  useEffect(() => {
    if (appliedPromocode) {
      try {
        localStorage.setItem('applied_promocode', JSON.stringify(appliedPromocode))
      } catch (e) {
        console.error('Error saving promocode to localStorage:', e)
      }
    } else {
      localStorage.removeItem('applied_promocode')
    }
  }, [appliedPromocode])

  // Редирект на страницу входа если не авторизован
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      onClose()
      router.push(`/login?redirect=/courses/${courseId}`)
    }
  }, [isOpen, isAuthenticated, onClose, router, courseId])

  // Добавляем/удаляем класс modal-open к body для скрытия Header
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // Обновляем финальную сумму при изменении промокода или исходной цены
  useEffect(() => {
    if (appliedPromocode) {
      let discount = 0
      if (appliedPromocode.discountPercent) {
        // Процентная скидка
        discount = Math.round(coursePrice * appliedPromocode.discountPercent / 100)
      } else if (appliedPromocode.discountAmount) {
        // Фиксированная скидка
        // discountAmount может быть в рублях (если < 100) или уже в копейках (если >= 100)
        // Проверяем: если значение меньше 100, считаем что это рубли, иначе - копейки
        if (appliedPromocode.discountAmount < 100) {
          discount = Math.round(appliedPromocode.discountAmount * 100) // конвертируем рубли в копейки
        } else {
          discount = Math.round(appliedPromocode.discountAmount) // уже в копейках
        }
      }
      
      // Ограничиваем скидку максимальной суммой - не больше исходной цены
      discount = Math.min(discount, coursePrice)
      
      // Финальная сумма не может быть меньше 0, но минимум 100 копеек (1 рубль)
      const calculatedAmount = Math.max(0, coursePrice - discount)
      setFinalAmount(calculatedAmount < 100 ? coursePrice : calculatedAmount)
    } else {
      setFinalAmount(coursePrice)
    }
  }, [appliedPromocode, coursePrice])

  // Валидация промокода при вводе (debounce)
  useEffect(() => {
    if (!promocodeInput.trim() || !isOpen) {
      setAppliedPromocode(null)
      setPromocodeError(null)
      return
    }

    const timeoutId = setTimeout(() => {
      validatePromocode(promocodeInput.trim())
    }, 500) // Задержка 500ms

    return () => clearTimeout(timeoutId)
  }, [promocodeInput, isOpen, courseId])

  const validatePromocode = async (code: string) => {
    if (!code || !user) return

    setIsValidatingPromocode(true)
    setPromocodeError(null)

    try {
      const response = await fetch('/api/promocodes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          courseId: courseId || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setPromocodeError(data.error || 'Промокод недействителен')
        setAppliedPromocode(null)
        return
      }

      if (data.success && data.promocode) {
        setAppliedPromocode(data.promocode)
        setPromocodeError(null)
      } else {
        setPromocodeError('Промокод не найден')
        setAppliedPromocode(null)
      }
    } catch (error: any) {
      console.error('Error validating promocode:', error)
      setPromocodeError('Ошибка проверки промокода')
      setAppliedPromocode(null)
    } finally {
      setIsValidatingPromocode(false)
    }
  }

  const handleClearPromocode = () => {
    setPromocodeInput('')
    setAppliedPromocode(null)
    setPromocodeError(null)
    localStorage.removeItem('applied_promocode')
  }

  const handlePayment = async () => {
    // Двойная проверка авторизации
    if (!isAuthenticated) {
      onClose()
      router.push(`/login?redirect=/courses/${courseId}`)
      return
    }

    setIsLoading(true)
    setError(null)

    const userId = user?.id
    
    if (!userId) {
      setError('Необходимо авторизоваться для оплаты')
      setIsLoading(false)
      return
    }

    // Проверяем наличие email или phone (из формы или из БД)
    const finalEmail = email.trim() || user?.email || ''
    const finalPhone = phone.trim() || user?.phone || ''
    
    if (!finalEmail && !finalPhone) {
      setError('Необходимо указать email или телефон для получения чека')
      setIsLoading(false)
      return
    }

    // Проверка минимальной суммы оплаты (минимум 1 рубль = 100 копеек)
    if (finalAmount < 100) {
      setError('Минимальная сумма оплаты: 1₽. Скидка не может превышать стоимость курса.')
      setIsLoading(false)
      return
    }

    try {
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: courseId || (type === 'promotion' && promotionId === 'two_courses' ? null : undefined),
          paymentMethod: selectedMethod,
          amount: finalAmount, // Используем финальную сумму с учетом промокода (в копейках)
          promocode: appliedPromocode ? {
            id: appliedPromocode.id,
            code: appliedPromocode.code,
            discountPercent: appliedPromocode.discountPercent,
            discountAmount: appliedPromocode.discountAmount
          } : null,
          userId: userId,
          returnUrl: `${window.location.origin}/payment/success${courseId ? `?course=${courseId}` : ''}`,
          type: type,
          receipt: {
            ...(finalEmail && finalEmail.includes('@') && { email: finalEmail }),
            ...(finalPhone && { 
              phone: finalPhone.startsWith('+') 
                ? finalPhone 
                : finalPhone.replace(/\D/g, '').startsWith('7')
                ? `+${finalPhone.replace(/\D/g, '')}`
                : finalPhone.replace(/\D/g, '').startsWith('8')
                ? `+7${finalPhone.replace(/\D/g, '').slice(1)}`
                : `+7${finalPhone.replace(/\D/g, '')}`
            })
          },
          metadata: {
            is_full_access: isFullAccess,
            ...(promotionId && { promotion_id: promotionId })
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      if (data.confirmationUrl) {
        // Очищаем промокод из localStorage перед переходом на оплату
        if (appliedPromocode) {
          localStorage.removeItem('applied_promocode')
        }
        // Для Telegram Web App используем openLink, для браузера - window.location
        if (isTelegramApp && webApp) {
          webApp.openLink(data.confirmationUrl)
        } else {
          window.location.href = data.confirmationUrl
        }
      } else {
        // Для демо - просто показываем успех
        if (appliedPromocode) {
          localStorage.removeItem('applied_promocode')
        }
        if (onPaymentSuccess) {
          onPaymentSuccess()
        }
        onClose()
      }

    } catch (err: any) {
      console.error('Ошибка оплаты:', err)
      setError(err.message || 'Произошла ошибка при оплате')
      setIsLoading(false)
    }
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
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card max-w-lg w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric p-0.5">
                    <div className="w-full h-full rounded-[10px] bg-dark-900 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-accent-gold" />
                    </div>
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-accent-gold/10 to-accent-electric/10 border border-accent-gold/20">
                <div className="space-y-2">
                  {appliedPromocode && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Исходная цена:</span>
                      <span className="text-white/60 line-through">
                        {formatPrice(coursePrice / 100)}
                      </span>
                    </div>
                  )}
                  {appliedPromocode && (() => {
                    let discountDisplay = ''
                    let discountValue = 0
                    if (appliedPromocode.discountPercent) {
                      discountValue = Math.round(coursePrice * appliedPromocode.discountPercent / 100)
                      discountDisplay = `-${appliedPromocode.discountPercent}%`
                    } else if (appliedPromocode.discountAmount) {
                      // discountAmount в рублях, конвертируем в копейки
                      discountValue = appliedPromocode.discountAmount < 100 
                        ? Math.round(appliedPromocode.discountAmount * 100)
                        : Math.round(appliedPromocode.discountAmount)
                      // Ограничиваем скидку максимальной суммой
                      discountValue = Math.min(discountValue, coursePrice)
                      discountDisplay = `-${formatPrice(discountValue / 100)}`
                    }
                    return discountValue > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-400">Скидка:</span>
                        <span className="text-emerald-400 font-semibold">
                          {discountDisplay}
                        </span>
                      </div>
                    ) : null
                  })()}
                  <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                    <span className="text-white/70">К оплате:</span>
                    <span className="font-display font-bold text-3xl bg-gradient-to-r from-accent-gold to-accent-electric bg-clip-text text-transparent">
                      {formatPrice(finalAmount / 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Promocode Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Промокод
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Tag className="w-5 h-5 text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={promocodeInput}
                    onChange={(e) => setPromocodeInput(e.target.value.toUpperCase())}
                    placeholder="Введите промокод"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-gold/50 focus:ring-2 focus:ring-accent-gold/20 transition-all"
                  />
                  {isValidatingPromocode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-accent-gold animate-spin" />
                    </div>
                  )}
                  {appliedPromocode && !isValidatingPromocode && (
                    <button
                      onClick={handleClearPromocode}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {appliedPromocode && !isValidatingPromocode && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                </div>
                {promocodeError && (
                  <p className="text-sm text-red-400">{promocodeError}</p>
                )}
                {appliedPromocode && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">
                      Промокод "{appliedPromocode.code}" применён!
                    </span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white text-sm">Способ оплаты:</h3>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-3 rounded-xl glass hover:bg-white/10 transition-all text-left flex items-center gap-3 ${
                        selectedMethod === method.id
                          ? 'border-2 border-accent-electric bg-accent-electric/10'
                          : 'border-2 border-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{method.name}</div>
                        <div className="text-white/50 text-xs">{method.description}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === method.id
                          ? 'border-accent-electric bg-accent-electric'
                          : 'border-white/30'
                      }`}>
                        {selectedMethod === method.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-dark-900 text-xs font-bold"
                          >
                            ✓
                          </motion.div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* TON Payment for Telegram */}
              {isTelegramApp && (
                <div className="pt-4 border-t border-white/10">
                  <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    Оплата криптовалютой (TON)
                  </h3>
                  <TonPaymentButton
                    amountRub={coursePrice / 100}
                    courseId={courseId || 'unknown'}
                    courseName={courseTitle}
                    userId={user?.id || ''}
                    onSuccess={() => {
                      if (onPaymentSuccess) {
                        onPaymentSuccess()
                      }
                      onClose()
                    }}
                    onError={(error) => {
                      setError(error)
                    }}
                  />
                </div>
              )}

              {/* Email/Phone для чека */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-mint/10 border border-accent-mint/20">
                  <Mail className="w-4 h-4 text-accent-mint flex-shrink-0 mt-1" />
                  <div className="flex-1 text-sm text-white/70">
                    <div className="font-semibold text-white mb-1">Для отправки чека</div>
                    <div>Укажите email или телефон для получения чека</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Email {!user?.email && '(необходимо указать email или телефон)'}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Телефон {!user?.phone && '(необходимо указать email или телефон)'}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric transition-colors"
                      />
                    </div>
                    <p className="mt-1 text-xs text-white/40">Обязательно укажите email или телефон (хотя бы один)</p>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-neon/10 border border-accent-neon/20">
                <Shield className="w-5 h-5 text-accent-neon flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  <div className="font-semibold text-white mb-1">Безопасная оплата</div>
                  <div>Платеж защищен SSL-шифрованием через ЮKassa. Мы не храним данные вашей карты.</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  isLoading={isLoading}
                  disabled={isLoading || finalAmount < 100}
                >
                  {isLoading 
                    ? 'Создание платежа...' 
                    : finalAmount < 100
                    ? 'Минимальная сумма: 1₽'
                    : `Оплатить ${formatPrice(finalAmount / 100)}`}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
              </div>

              {/* Payment Logos */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/10">
                <span className="text-white/40 text-xs">Платежи обрабатывает:</span>
                <span className="text-accent-electric font-bold text-sm">ЮKassa</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
