'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, TrendingUp, TrendingDown, CreditCard, ExternalLink, Check, Copy, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTelegram } from '@/components/providers/TelegramProvider'

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

export function WalletModal({ isOpen, onClose, balance = 0, totalEarned = 0, totalWithdrawn = 0 }: WalletModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'topup' | 'withdraw' | 'ton'>('topup')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'card' | 'sbp' | 'yoomoney' | 'phone'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null)
  const [isConnectingTon, setIsConnectingTon] = useState(false)
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()
  const { isTelegramApp, webApp } = useTelegram()

  // Загружаем подключенный TON кошелек
  useEffect(() => {
    if (user?.id && isOpen) {
      fetchTonWallet()
    }
  }, [user?.id, isOpen])

  const fetchTonWallet = async () => {
    try {
      const response = await fetch('/api/profile/wallet/connect', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.wallet_address) {
          setTonWalletAddress(data.wallet_address)
        }
      }
    } catch (err) {
      console.error('Error fetching TON wallet:', err)
    }
  }

  // Блокируем скролл body когда модалка открыта
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Math.round(amountNum * 100),
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

  const handleConnectTonWallet = async () => {
    setIsConnectingTon(true)
    
    try {
      // Открываем диалог подключения TON кошелька
      if (isTelegramApp && webApp) {
        // В Telegram показываем инструкцию
        webApp.showPopup({
          title: 'Подключение TON кошелька',
          message: 'Для подключения кошелька:\n\n1. Откройте Tonkeeper или TON Space\n2. Скопируйте адрес вашего кошелька\n3. Вставьте его в поле ниже',
          buttons: [
            { id: 'ok', type: 'ok', text: 'Понятно' }
          ]
        })
      }

      // Показываем поле для ввода адреса
      const address = prompt('Введите адрес вашего TON кошелька:')
      
      if (address && address.trim()) {
        // Валидация адреса TON (базовая)
        if (!address.match(/^(EQ|UQ)[a-zA-Z0-9_-]{46}$/)) {
          alert('Неверный формат адреса TON кошелька')
          return
        }

        // Сохраняем адрес
        const response = await fetch('/api/profile/wallet/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ wallet_address: address.trim() })
        })

        if (response.ok) {
          setTonWalletAddress(address.trim())
          webApp?.HapticFeedback?.notificationOccurred('success')
          alert('TON кошелек успешно подключен!')
        } else {
          throw new Error('Не удалось сохранить адрес')
        }
      }
    } catch (err: any) {
      console.error('TON connect error:', err)
      alert(err.message || 'Ошибка подключения кошелька')
    } finally {
      setIsConnectingTon(false)
    }
  }

  const handleDisconnectTonWallet = async () => {
    if (!confirm('Отключить TON кошелек?')) return

    try {
      const response = await fetch('/api/profile/wallet/disconnect', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setTonWalletAddress(null)
        alert('TON кошелек отключен')
      }
    } catch (err) {
      console.error('Error disconnecting wallet:', err)
    }
  }

  const handleWithdraw = async () => {
    const amountNum = parseFloat(withdrawAmount)
    if (!amountNum || amountNum < 500) {
      alert('Минимальная сумма вывода: 500₽')
      return
    }

    if (amountNum > balance / 100) {
      alert('Недостаточно средств на балансе')
      return
    }

    if (!user?.id) {
      alert('Необходимо авторизоваться')
      return
    }

    if (withdrawMethod === 'card' && !cardNumber) {
      alert('Укажите номер карты')
      return
    }

    if (withdrawMethod === 'phone' && !phoneNumber) {
      alert('Укажите номер телефона')
      return
    }

    setIsWithdrawing(true)
    try {
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountNum,
          withdrawal_method: withdrawMethod,
          card_number: withdrawMethod === 'card' ? cardNumber : null,
          phone: withdrawMethod === 'phone' ? phoneNumber : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания заявки на вывод')
      }

      alert('Заявка на вывод создана! Средства будут переведены в течение 1-3 рабочих дней.')
      onClose()
      window.location.reload()
    } catch (err: any) {
      console.error('Withdraw error:', err)
      alert(err.message || 'Ошибка при создании заявки на вывод')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const copyTonAddress = async () => {
    if (!tonWalletAddress) return
    try {
      await navigator.clipboard.writeText(tonWalletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy error:', err)
    }
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-dark-900/90 backdrop-blur-md"
          style={{ zIndex: 9998 }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl glass border border-white/10 overflow-hidden flex flex-col"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10" />
          
          <div className="relative z-10 flex flex-col h-full max-h-[90vh]">
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

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('topup')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'topup'
                    ? 'text-accent-teal border-b-2 border-accent-teal'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                💳 Пополнение
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'withdraw'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                💰 Вывод
              </button>
              <button
                onClick={() => setActiveTab('ton')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'ton'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                💎 TON Кошелек
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Balance Info */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-white/60">Текущий баланс</p>
                  <p className="text-3xl font-display font-bold text-white">
                    {(balance / 100).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent-mint" />
                    <div>
                      <p className="text-xs text-white/50">Заработано</p>
                      <p className="text-lg font-bold text-accent-mint">
                        +{(totalEarned / 100).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-white/40" />
                    <div>
                      <p className="text-xs text-white/50">Выведено</p>
                      <p className="text-lg font-bold text-white/70">
                        {(totalWithdrawn / 100).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {activeTab === 'topup' ? (
                <>
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
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-dark-900 font-bold text-lg shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
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
                </>
              ) : activeTab === 'withdraw' ? (
                <>
                  {/* Withdraw Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Вывести средства</h3>
                    
                    {/* Amount Input */}
                    <div className="mb-4">
                      <label className="block text-sm text-white/70 mb-2">Сумма вывода</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="500"
                          min="500"
                          step="100"
                          max={balance / 100}
                          className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-semibold focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">₽</span>
                      </div>
                      <p className="mt-2 text-xs text-white/50">
                        Минимальная сумма: 500₽ | Доступно: {(balance / 100).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>

                    {/* Withdrawal Methods */}
                    <div className="mb-4">
                      <label className="block text-sm text-white/70 mb-3">Способ вывода</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setWithdrawMethod('card')}
                          className={`p-4 rounded-xl border transition-all ${
                            withdrawMethod === 'card'
                              ? 'bg-yellow-400/20 border-yellow-400 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💳</span>
                            <div className="text-left">
                              <p className="font-semibold text-sm">На карту</p>
                              <p className="text-xs opacity-70">Visa, Mastercard, МИР</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setWithdrawMethod('sbp')}
                          className={`p-4 rounded-xl border transition-all ${
                            withdrawMethod === 'sbp'
                              ? 'bg-yellow-400/20 border-yellow-400 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📱</span>
                            <div className="text-left">
                              <p className="font-semibold text-sm">СБП</p>
                              <p className="text-xs opacity-70">Быстрый перевод</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setWithdrawMethod('yoomoney')}
                          className={`p-4 rounded-xl border transition-all ${
                            withdrawMethod === 'yoomoney'
                              ? 'bg-yellow-400/20 border-yellow-400 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💜</span>
                            <div className="text-left">
                              <p className="font-semibold text-sm">ЮMoney</p>
                              <p className="text-xs opacity-70">Электронный кошелек</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setWithdrawMethod('phone')}
                          className={`p-4 rounded-xl border transition-all ${
                            withdrawMethod === 'phone'
                              ? 'bg-yellow-400/20 border-yellow-400 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📞</span>
                            <div className="text-left">
                              <p className="font-semibold text-sm">На телефон</p>
                              <p className="text-xs opacity-70">Мобильный баланс</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Card Number Input */}
                    {withdrawMethod === 'card' && (
                      <div className="mb-4">
                        <label className="block text-sm text-white/70 mb-2">Номер карты</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length <= 16) {
                              setCardNumber(value)
                            }
                          }}
                          placeholder="0000 0000 0000 0000"
                          maxLength={16}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-semibold focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                      </div>
                    )}

                    {/* Phone Number Input */}
                    {withdrawMethod === 'phone' && (
                      <div className="mb-4">
                        <label className="block text-sm text-white/70 mb-2">Номер телефона</label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length <= 11) {
                              setPhoneNumber(value)
                            }
                          }}
                          placeholder="+7 900 123 45 67"
                          maxLength={11}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-semibold focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                      </div>
                    )}

                    {/* Withdraw Button */}
                    <button
                      onClick={handleWithdraw}
                      disabled={
                        !withdrawAmount || 
                        parseFloat(withdrawAmount) < 500 || 
                        parseFloat(withdrawAmount) > balance / 100 ||
                        isWithdrawing ||
                        (withdrawMethod === 'card' && !cardNumber) ||
                        (withdrawMethod === 'phone' && !phoneNumber)
                      }
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 text-dark-900 font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-5 h-5" />
                          Вывести средства
                        </>
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                    <p className="text-sm text-white/80">
                      <strong className="text-yellow-400">💡 Важно:</strong> Средства будут переведены в течение 1-3 рабочих дней. 
                      Комиссия за вывод зависит от выбранного способа (обычно 1-3%).
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* TON Wallet Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                        <span className="text-xl">💎</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">TON Кошелек</h3>
                        <p className="text-xs text-white/60">Для оплаты криптовалютой в Telegram</p>
                      </div>
                    </div>

                    {tonWalletAddress ? (
                      <>
                        {/* Connected Wallet */}
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-blue-400 font-semibold">✓ Кошелек подключен</span>
                            <button
                              onClick={handleDisconnectTonWallet}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Отключить
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm text-white font-mono bg-white/5 px-3 py-2 rounded-lg truncate">
                              {tonWalletAddress}
                            </code>
                            <button
                              onClick={copyTonAddress}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-white/60" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* TON Balance (placeholder) */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-white/60 mb-1">Баланс TON</p>
                          <p className="text-2xl font-bold text-white">— TON</p>
                          <p className="text-xs text-white/40 mt-1">Проверьте баланс в вашем кошельке</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Connect Wallet */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                            <span className="text-3xl">💎</span>
                          </div>
                          <h4 className="text-lg font-bold text-white mb-2">Подключите TON кошелек</h4>
                          <p className="text-sm text-white/60 mb-4">
                            Оплачивайте курсы криптовалютой TON прямо в Telegram
                          </p>
                          
                          <motion.button
                            onClick={handleConnectTonWallet}
                            disabled={isConnectingTon}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isConnectingTon ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                                Подключение...
                              </>
                            ) : (
                              '🔗 Подключить кошелек'
                            )}
                          </motion.button>
                        </div>

                        {/* Supported Wallets */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-white/60 mb-3">Поддерживаемые кошельки:</p>
                          <div className="flex flex-wrap gap-2">
                            {['Tonkeeper', 'TON Space', 'MyTonWallet', 'OpenMask'].map((wallet) => (
                              <span key={wallet} className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">
                                {wallet}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Info */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-white/80">
                        <strong className="text-blue-400">💡 Зачем TON кошелек?</strong> Вы сможете оплачивать курсы криптовалютой TON внутри Telegram с минимальной комиссией.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
