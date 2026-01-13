'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Loader2, CheckCircle2, Copy, ExternalLink, X, QrCode, Smartphone } from 'lucide-react'
import { useTelegram } from '@/components/providers/TelegramProvider'

interface TonPaymentButtonProps {
  amountRub: number
  courseId: string
  courseName: string
  userId?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

// Курс TON/RUB
const TON_TO_RUB_RATE = 450

// Адрес кошелька для приёма платежей
const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_TON_WALLET_ADDRESS || ''

// Поддерживаемые кошельки
const WALLETS = [
  {
    id: 'tonkeeper',
    name: 'Tonkeeper',
    icon: '💎',
    color: 'from-blue-500 to-blue-600',
    universalLink: 'https://app.tonkeeper.com/transfer/',
    deepLink: 'tonkeeper://transfer/',
  },
  {
    id: 'tonhub',
    name: 'TON Space',
    icon: '🌐',
    color: 'from-purple-500 to-purple-600',
    universalLink: 'https://tonhub.com/transfer/',
    deepLink: 'tonhub://transfer/',
  },
  {
    id: 'mytonwallet',
    name: 'MyTonWallet',
    icon: '🔷',
    color: 'from-cyan-500 to-cyan-600',
    universalLink: 'https://mytonwallet.app/transfer/',
    deepLink: 'mytonwallet://transfer/',
  },
]

export function TonPaymentButton({ 
  amountRub, 
  courseId, 
  courseName, 
  userId,
  onSuccess, 
  onError 
}: TonPaymentButtonProps) {
  const { isTelegramApp, webApp } = useTelegram()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copied, setCopied] = useState<'address' | 'amount' | 'comment' | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLETS[0] | null>(null)

  // Расчет суммы в TON
  const amountTon = (amountRub / TON_TO_RUB_RATE).toFixed(4)
  const amountNano = Math.floor(parseFloat(amountTon) * 1_000_000_000)
  
  // Комментарий для идентификации платежа
  const shortUserId = userId ? userId.substring(0, 8) : 'guest'
  const shortCourseId = courseId.substring(0, 8)
  const paymentComment = `CH-${shortCourseId}-${shortUserId}`

  // Добавляем/удаляем класс modal-open к body для скрытия Header
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isModalOpen])

  // Не показываем если адрес не настроен
  if (!RECEIVER_ADDRESS || RECEIVER_ADDRESS === 'your_ton_wallet_address') {
    return null
  }

  // Показываем только в Telegram Web App
  if (!isTelegramApp) {
    return null
  }

  const copyToClipboard = async (text: string, type: 'address' | 'amount' | 'comment') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      webApp?.HapticFeedback.notificationOccurred('success')
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const openWallet = (wallet: typeof WALLETS[0]) => {
    setSelectedWallet(wallet)
    
    // Формируем URL для перевода
    const params = new URLSearchParams({
      amount: amountNano.toString(),
      text: paymentComment,
    })
    
    // Используем universal link (работает везде)
    const transferUrl = `${wallet.universalLink}${RECEIVER_ADDRESS}?${params.toString()}`
    
    // Пробуем открыть
    if (webApp) {
      // Telegram WebApp использует openLink для внешних ссылок
      webApp.openLink(transferUrl)
      webApp.HapticFeedback.impactOccurred('medium')
    } else {
      window.open(transferUrl, '_blank')
    }
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    webApp?.HapticFeedback.impactOccurred('light')
  }

  return (
    <>
      {/* Main Button */}
      <motion.button
        onClick={handleOpenModal}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-3"
      >
        <Wallet className="w-5 h-5" />
        Оплатить {amountTon} TON
      </motion.button>

      {/* Payment Modal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full sm:max-w-md bg-dark-800 rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 bg-dark-800 p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Оплата TON</h3>
                      <p className="text-white/50 text-sm">{courseName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Amount Info */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <div className="text-center">
                      <p className="text-white/50 text-sm mb-1">К оплате:</p>
                      <p className="text-3xl font-bold text-white">{amountTon} TON</p>
                      <p className="text-white/40 text-sm mt-1">≈ {amountRub.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>

                  {/* Wallet Selection */}
                  <div>
                    <p className="text-white/70 text-sm mb-3 font-medium">Выберите кошелёк:</p>
                    <div className="space-y-2">
                      {WALLETS.map((wallet) => (
                        <motion.button
                          key={wallet.id}
                          onClick={() => openWallet(wallet)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-4`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${wallet.color} flex items-center justify-center text-2xl`}>
                            {wallet.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium">{wallet.name}</p>
                            <p className="text-white/40 text-sm">Открыть для оплаты</p>
                          </div>
                          <ExternalLink className="w-5 h-5 text-white/30" />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Payment */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/70 text-sm mb-3 font-medium">Или переведите вручную:</p>
                    
                    {/* Address */}
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/50 text-xs">Адрес:</span>
                          <button
                            onClick={() => copyToClipboard(RECEIVER_ADDRESS, 'address')}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {copied === 'address' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'address' ? 'Скопировано!' : 'Копировать'}
                          </button>
                        </div>
                        <p className="text-white font-mono text-sm break-all">{RECEIVER_ADDRESS}</p>
                      </div>

                      {/* Amount */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/50 text-xs">Сумма:</span>
                          <button
                            onClick={() => copyToClipboard(amountTon, 'amount')}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {copied === 'amount' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'amount' ? 'Скопировано!' : 'Копировать'}
                          </button>
                        </div>
                        <p className="text-white font-bold">{amountTon} TON</p>
                      </div>

                      {/* Comment */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/50 text-xs">Комментарий (обязательно!):</span>
                          <button
                            onClick={() => copyToClipboard(paymentComment, 'comment')}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {copied === 'comment' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'comment' ? 'Скопировано!' : 'Копировать'}
                          </button>
                        </div>
                        <p className="text-white font-mono text-sm">{paymentComment}</p>
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-400 text-xs">
                      ⚠️ Обязательно укажите комментарий при переводе! Без него платёж не будет идентифицирован.
                    </p>
                  </div>

                  {/* Done Button */}
                  <motion.button
                    onClick={() => {
                      setIsModalOpen(false)
                      webApp?.showAlert('После перевода доступ откроется автоматически в течение 5 минут.')
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
                  >
                    Я оплатил
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
