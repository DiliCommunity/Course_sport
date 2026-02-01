'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, CheckCircle2, Shield, Loader2, Mail, Phone, Tag, X, Check } from 'lucide-react'
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
    id: 'yoomoney',
    name: 'ЮMoney',
    description: 'Электронный кошелек',
    icon: '💜',
  },
]

function PaymentPageContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const courseId = searchParams.get('course')
  const courseTitle = searchParams.get('title') || 'Курс'
  const coursePrice = parseInt(searchParams.get('price') || '169900') // 1699₽ = 169900 копеек
  const type = searchParams.get('type') || 'course_purchase' // course_purchase или balance_topup
  const amount = searchParams.get('amount') ? parseInt(searchParams.get('amount')!) : coursePrice

  const [selectedMethod, setSelectedMethod] = useState('card')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  // Промокоды
  const [promocodeInput, setPromocodeInput] = useState('')
  const [appliedPromocode, setAppliedPromocode] = useState<any>(null)
  const [userPromocodes, setUserPromocodes] = useState<any[]>([])
  const [isValidatingPromocode, setIsValidatingPromocode] = useState(false)
  const [promocodeError, setPromocodeError] = useState<string | null>(null)
  const [finalAmount, setFinalAmount] = useState(amount)

  // Заполняем email/phone из БД при загрузке
  useEffect(() => {
    if (user) {
      if (user.email && !email) {
        setEmail(user.email)
      }
      if (user.phone && !phone) {
        setPhone(user.phone)
      }
    }
  }, [user])

  // Загружаем примененные промокоды пользователя
  useEffect(() => {
    if (user && type === 'course_purchase') {
      fetchUserPromocodes()
    }
  }, [user, type, courseId])

  // Обновляем финальную сумму при изменении промокода или исходной суммы
  useEffect(() => {
    if (appliedPromocode) {
      let discount = 0
      if (appliedPromocode.discountPercent) {
        discount = Math.round(amount * appliedPromocode.discountPercent / 100)
      } else if (appliedPromocode.discountAmount) {
        discount = appliedPromocode.discountAmount
      }
      setFinalAmount(Math.max(0, amount - discount))
    } else {
      setFinalAmount(amount)
    }
  }, [appliedPromocode, amount])

  const fetchUserPromocodes = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/promocodes/user')
      const data = await response.json()

      if (data.success && data.promocodes) {
        // Фильтруем промокоды, которые можно использовать для этого курса
        const applicablePromocodes = data.promocodes.filter((p: any) => {
          // Если промокод привязан к курсу, проверяем совпадение
          if (p.courseId) {
            return p.courseId === courseId
          }
          // Если промокод универсальный (не привязан к курсу), можно использовать
          return true
        })
        setUserPromocodes(applicablePromocodes)
      }
    } catch (error) {
      console.error('Error fetching user promocodes:', error)
    }
  }

  const handleValidatePromocode = async () => {
    if (!promocodeInput.trim()) {
      setPromocodeError('Введите промокод')
      return
    }

    setIsValidatingPromocode(true)
    setPromocodeError(null)

    try {
      const response = await fetch('/api/promocodes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promocodeInput.trim(),
          courseId: type === 'course_purchase' ? courseId : null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPromocodeError(data.error || 'Ошибка проверки промокода')
        return
      }

      if (data.success && data.promocode) {
        setAppliedPromocode(data.promocode)
        setPromocodeInput('')
        setPromocodeError(null)
      }
    } catch (error: any) {
      setPromocodeError('Ошибка при проверке промокода')
    } finally {
      setIsValidatingPromocode(false)
    }
  }

  const handleSelectUserPromocode = (promocode: any) => {
    setAppliedPromocode({
      id: promocode.promocodeId,
      code: promocode.code,
      discountPercent: promocode.discountPercent,
      discountAmount: promocode.discountAmount,
      description: promocode.description,
      promoType: promocode.promoType
    })
    setPromocodeError(null)
  }

  const handleRemovePromocode = () => {
    setAppliedPromocode(null)
    setPromocodeInput('')
    setPromocodeError(null)
  }

  const handlePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const userId = user?.id || null

      if (typeof window === 'undefined') {
        throw new Error('Ошибка инициализации')
      }

      // Проверяем наличие email или phone (из формы или из БД)
      const finalEmail = email.trim() || user?.email || ''
      const finalPhone = phone.trim() || user?.phone || ''
      
      if (!finalEmail && !finalPhone) {
        setError('Необходимо указать email или телефон для получения чека')
        setIsLoading(false)
        return
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
          amount: finalAmount * 100, // Конвертируем в копейки (с учетом скидки)
          userId: userId,
          type: type,
          returnUrl: returnUrl,
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
          promocode: appliedPromocode ? {
            id: appliedPromocode.id,
            code: appliedPromocode.code,
            discountPercent: appliedPromocode.discountPercent,
            discountAmount: appliedPromocode.discountAmount
          } : null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      if (data.confirmationUrl) {
        // Для Telegram Web App используем openLink, для браузера - window.location
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          window.Telegram.WebApp.openLink(data.confirmationUrl)
        } else {
          window.location.href = data.confirmationUrl
        }
      } else {
        throw new Error('Не получена ссылка на оплату')
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка. Попробуйте позже.')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16 flex items-center justify-center px-4">
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
            {appliedPromocode && amount !== finalAmount && (
              <div className="mb-2">
                <div className="text-lg text-white/60 line-through">
                  {formatPrice(amount)}
                </div>
                <div className="text-xs text-accent-gold mt-1">
                  Скидка: {appliedPromocode.discountPercent 
                    ? `${appliedPromocode.discountPercent}%` 
                    : formatPrice(appliedPromocode.discountAmount || 0)}
                </div>
              </div>
            )}
            <div className="text-5xl font-black bg-gradient-to-r from-accent-gold to-accent-electric bg-clip-text text-transparent mb-2">
              {formatPrice(finalAmount)}
            </div>
            <div className="inline-block bg-accent-flame text-white px-3 py-1 rounded-full text-xs font-bold">
              БЕЗОПАСНО
            </div>
          </div>

          {/* Промокоды - только для покупки курса */}
          {type === 'course_purchase' && (
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-gold/10 border border-accent-gold/20">
                <Tag className="w-4 h-4 text-accent-gold flex-shrink-0 mt-1" />
                <div className="flex-1 text-sm text-white/70">
                  <div className="font-semibold text-white mb-1">Промокод</div>
                  <div>Введите промокод для получения скидки</div>
                </div>
              </div>

              {/* Примененный промокод */}
              {appliedPromocode && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="font-semibold text-white">Промокод применён: {appliedPromocode.code}</div>
                        {appliedPromocode.description && (
                          <div className="text-xs text-white/60 mt-1">{appliedPromocode.description}</div>
                        )}
                        <div className="text-xs text-green-400 mt-1">
                          Скидка: {appliedPromocode.discountPercent 
                            ? `${appliedPromocode.discountPercent}%` 
                            : formatPrice(appliedPromocode.discountAmount || 0)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemovePromocode}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>
              )}

              {/* Список примененных промокодов пользователя */}
              {!appliedPromocode && userPromocodes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-white/70 mb-2">Ваши промокоды:</div>
                  {userPromocodes.map((promocode) => (
                    <motion.button
                      key={promocode.id}
                      onClick={() => handleSelectUserPromocode(promocode)}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{promocode.code}</div>
                          {promocode.description && (
                            <div className="text-xs text-white/60 mt-1">{promocode.description}</div>
                          )}
                          <div className="text-xs text-accent-gold mt-1">
                            Скидка: {promocode.discountPercent 
                              ? `${promocode.discountPercent}%` 
                              : formatPrice(promocode.discountAmount || 0)}
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-accent-gold" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Поле ввода промокода */}
              {!appliedPromocode && (
                <div>
                  <label className="block text-sm text-white/70 mb-2">Введите промокод</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={promocodeInput}
                        onChange={(e) => {
                          setPromocodeInput(e.target.value.toUpperCase())
                          setPromocodeError(null)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleValidatePromocode()
                          }
                        }}
                        placeholder="Введите промокод"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-gold transition-colors uppercase"
                      />
                    </div>
                    <Button
                      onClick={handleValidatePromocode}
                      disabled={isValidatingPromocode || !promocodeInput.trim()}
                      className="px-6"
                    >
                      {isValidatingPromocode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Применить'
                      )}
                    </Button>
                  </div>
                  {promocodeError && (
                    <p className="mt-2 text-xs text-red-400">{promocodeError}</p>
                  )}
                </div>
              )}
            </div>
          )}

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

          {/* Email/Phone для чека */}
          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-electric/10 border border-accent-electric/20">
              <Mail className="w-4 h-4 text-accent-electric flex-shrink-0 mt-1" />
              <div className="flex-1 text-sm text-white/70">
                <div className="font-semibold text-white mb-1">Для отправки чека</div>
                <div>Укажите email или телефон для получения чека</div>
              </div>
            </div>
            
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
                Оплатить {formatPrice(finalAmount)}
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

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-20 pb-16 flex items-center justify-center px-4">
        <div className="text-white text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Загрузка...</p>
        </div>
      </main>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}

