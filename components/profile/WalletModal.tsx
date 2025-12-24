'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  balance: number
  totalEarned: number
  totalWithdrawn: number
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Банковская карта',
    icon: '💳',
    description: 'Visa, Mastercard, МИР'
  },
  {
    id: 'sbp',
    name: 'СБП',
    icon: '📱',
    description: 'Система быстрых платежей'
  },
  {
    id: 'sber_pay',
    name: 'СберПей',
    icon: '💚',
    description: 'Оплата через Сбербанк'
  },
  {
    id: 'yoomoney',
    name: 'ЮMoney',
    icon: '💜',
    description: 'Электронный кошелек'
  }
]

export function WalletModal({ isOpen, onClose, balance, totalEarned, totalWithdrawn }: WalletModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()

  const handleTopUp = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum < 100) {
      alert('Минимальная сумма пополнения: 100₽')
      return
    }

    if (!user?.id) {
      alert('Необходимо авторизоваться')
      return
    }

    setIsProcessing(true)
    try {
      // Создаем платеж для пополнения баланса
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Math.round(amountNum * 100), // В копейках
          paymentMethod: selectedMethod,
          type: 'balance_topup',
          userId: user.id,
          returnUrl: `${window.location.origin}/profile`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа')
      }

      if (data.confirmationUrl || data.confirmation_url) {
        // Перенаправляем на страницу оплаты ЮКасса
        window.location.href = data.confirmationUrl || data.confirmation_url
      } else {
        alert('Платеж создан успешно!')
        onClose()
        window.location.reload()
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      alert(err.message || 'Ошибка при создании платежа')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl rounded-2xl glass border border-white/10 overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-mint/10" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-dark-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Кошелек</h2>
                  <p className="text-sm text-white/60">Управление балансом</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Balance Info */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-white/60">Текущий баланс</p>
                  <p className="text-3xl font-display font-bold text-white">
                    {balance.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent-mint" />
                    <div>
                      <p className="text-xs text-white/50">Заработано</p>
                      <p className="text-lg font-bold text-accent-mint">
                        +{totalEarned.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/50">Выведено</p>
                      <p className="text-lg font-bold text-white/70">
                        {totalWithdrawn.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Up Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Пополнить баланс</h3>
                
                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Сумма пополнения</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1000"
                      min="100"
                      step="100"
                      className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-semibold focus:outline-none focus:border-accent-teal transition-colors"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">₽</span>
                  </div>
                  <p className="mt-2 text-xs text-white/50">Минимальная сумма: 100₽</p>
                </div>

                {/* Payment Methods */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-3">Способ оплаты</label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedMethod === method.id
                            ? 'bg-accent-teal/20 border-accent-teal text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div className="text-left">
                            <p className="font-semibold text-sm">{method.name}</p>
                            <p className="text-xs opacity-70">{method.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Up Button */}
                <button
                  onClick={handleTopUp}
                  disabled={!amount || parseFloat(amount) < 100 || isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-teal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Пополнить баланс
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/20">
                <p className="text-sm text-white/80">
                  <strong className="text-accent-teal">💡 Важно:</strong> Средства на балансе можно использовать для покупки курсов или вывести на карту. 
                  Вывод средств доступен при балансе от 500₽.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

