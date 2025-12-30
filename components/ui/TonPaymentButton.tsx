'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { useTelegram } from '@/components/providers/TelegramProvider'

interface TonPaymentButtonProps {
  amountRub: number // Сумма в рублях
  courseId: string
  courseName: string
  userId?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

// Примерный курс TON/RUB (в реальности нужно получать через API)
const TON_TO_RUB_RATE = 450 // 1 TON ≈ 450 RUB

export function TonPaymentButton({ 
  amountRub, 
  courseId, 
  courseName, 
  userId,
  onSuccess, 
  onError 
}: TonPaymentButtonProps) {
  const { isTelegramApp, webApp } = useTelegram()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [tonRate, setTonRate] = useState(TON_TO_RUB_RATE)
  const [error, setError] = useState<string | null>(null)

  // Расчет суммы в TON
  const amountTon = (amountRub / tonRate).toFixed(4)

  // Получаем актуальный курс TON (опционально)
  useEffect(() => {
    const fetchTonRate = async () => {
      try {
        // Можно использовать CoinGecko API для реального курса
        // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub')
        // const data = await response.json()
        // setTonRate(data['the-open-network'].rub)
      } catch (err) {
        console.error('Failed to fetch TON rate:', err)
      }
    }

    fetchTonRate()
  }, [])

  // Показываем только в Telegram Web App
  if (!isTelegramApp) {
    return null
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Здесь будет интеграция с TON Connect
      // Для начала можно использовать Telegram Wallet API если доступен
      
      // Симуляция подключения (замените на реальную логику TON Connect)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // В реальности здесь будет:
      // const tonConnect = new TonConnect({ manifestUrl: '...' })
      // const wallet = await tonConnect.connect([...wallets])
      // setWalletAddress(wallet.account.address)
      
      setWalletConnected(true)
      setWalletAddress('EQ...demo...address') // Демо адрес
      
    } catch (err: any) {
      setError('Не удалось подключить кошелек')
      onError?.(err.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePayment = async () => {
    if (!walletConnected) {
      handleConnectWallet()
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Адрес кошелька для приема платежей (замените на ваш реальный адрес)
      const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_TON_WALLET_ADDRESS || 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG'
      
      // Создаем комментарий для идентификации платежа
      const paymentId = `${courseId}_${userId || 'guest'}_${Date.now()}`
      const comment = `Course:${paymentId}`

      // Сумма в наноTON (1 TON = 1,000,000,000 nanoTON)
      const amountNano = Math.floor(parseFloat(amountTon) * 1_000_000_000)

      // В реальности здесь будет отправка транзакции через TON Connect:
      // const transaction = {
      //   validUntil: Math.floor(Date.now() / 1000) + 600,
      //   messages: [{
      //     address: RECEIVER_ADDRESS,
      //     amount: amountNano.toString(),
      //     payload: comment
      //   }]
      // }
      // const result = await tonConnectUI.sendTransaction(transaction)

      // Для демонстрации используем Telegram's openInvoice или показываем инструкцию
      if (webApp) {
        // Открываем ссылку для перевода через Tonkeeper/другой кошелек
        const tonLink = `ton://transfer/${RECEIVER_ADDRESS}?amount=${amountNano}&text=${encodeURIComponent(comment)}`
        
        webApp.showPopup({
          title: 'Оплата TON',
          message: `Переведите ${amountTon} TON на указанный адрес.\n\nКомментарий к платежу:\n${comment}`,
          buttons: [
            { id: 'copy', type: 'default', text: 'Скопировать адрес' },
            { id: 'open', type: 'default', text: 'Открыть кошелек' },
            { id: 'cancel', type: 'cancel', text: 'Отмена' }
          ]
        }, async (buttonId) => {
          if (buttonId === 'copy') {
            navigator.clipboard.writeText(RECEIVER_ADDRESS)
            webApp.showAlert('Адрес скопирован!')
          } else if (buttonId === 'open') {
            webApp.openLink(tonLink)
          }
        })

        // Сохраняем pending платеж в БД
        await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            paymentMethod: 'crypto',
            amount: amountRub * 100, // в копейках
            userId,
            type: 'course_purchase',
            metadata: {
              crypto: 'TON',
              amountTon,
              paymentId,
              receiverAddress: RECEIVER_ADDRESS
            }
          })
        })

        webApp.HapticFeedback.notificationOccurred('success')
      }

    } catch (err: any) {
      console.error('TON payment error:', err)
      setError(err.message || 'Ошибка оплаты')
      onError?.(err.message)
      webApp?.HapticFeedback.notificationOccurred('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDisconnect = () => {
    setWalletConnected(false)
    setWalletAddress(null)
  }

  return (
    <div className="space-y-3">
      {/* TON Payment Info */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Сумма в TON:</span>
          <span className="text-white font-bold text-lg">{amountTon} TON</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Курс: 1 TON ≈ {tonRate.toLocaleString('ru-RU')} ₽</span>
          <span className="text-white/40">≈ {amountRub.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      {/* Wallet Status */}
      {walletConnected && walletAddress && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-accent-neon/10 border border-accent-neon/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-neon" />
            <span className="text-white/80 text-sm">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Отключить
          </button>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Button */}
      <motion.button
        onClick={handlePayment}
        disabled={isConnecting || isProcessing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Подключение кошелька...
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Обработка...
          </>
        ) : walletConnected ? (
          <>
            <Wallet className="w-5 h-5" />
            Оплатить {amountTon} TON
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            Подключить TON кошелек
          </>
        )}
      </motion.button>

      {/* Info */}
      <p className="text-xs text-white/40 text-center">
        Поддерживаются: Tonkeeper, TON Space, MyTonWallet
      </p>
    </div>
  )
}

