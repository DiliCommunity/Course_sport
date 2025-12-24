'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Copy, Check, Gift, Users, TrendingUp, Share2 } from 'lucide-react'

interface ReferralModalProps {
  isOpen: boolean
  onClose: () => void
  referralCode: string
  stats: {
    total_referred: number
    total_earned: number
    active_referrals: number
    completed_referrals: number
  }
}

export function ReferralModal({ isOpen, onClose, referralCode, stats }: ReferralModalProps) {
  const [copied, setCopied] = useState(false)
  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=${referralCode}`
    : ''

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Присоединяйся к Course Health!',
          text: 'Получи скидку на курсы по кето-диете и интервальному голоданию',
          url: referralUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      copyToClipboard()
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
          <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 via-transparent to-accent-electric/10" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center">
                  <Gift className="w-6 h-6 text-dark-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Реферальная программа</h2>
                  <p className="text-sm text-white/60">Зарабатывайте, приглашая друзей</p>
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
              {/* Instructions */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Как это работает:</h3>
                <ol className="space-y-2 text-white/70">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-sm font-bold">1</span>
                    <span>Скопируйте вашу реферальную ссылку ниже</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-sm font-bold">2</span>
                    <span>Поделитесь ссылкой с друзьями в соцсетях, мессенджерах или лично</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-sm font-bold">3</span>
                    <span>Когда друг зарегистрируется и купит курс, вы получите <strong className="text-accent-mint">30%</strong> от суммы покупки</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-sm font-bold">4</span>
                    <span>Заработанные средства можно вывести или потратить на курсы</span>
                  </li>
                </ol>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm text-white/70 mb-2 font-medium">Ваша реферальная ссылка</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <Link2 className="w-5 h-5 text-accent-teal flex-shrink-0" />
                    <input
                      type="text"
                      value={referralUrl}
                      readOnly
                      className="flex-1 bg-transparent text-white text-sm outline-none"
                    />
                  </div>
                  <motion.button
                    onClick={copyToClipboard}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </motion.button>
                  {navigator.share && (
                    <motion.button
                      onClick={shareLink}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-accent-mint"
                  >
                    Ссылка скопирована!
                  </motion.p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-accent-teal" />
                    <p className="text-xs text-white/60">Приглашено друзей</p>
                  </div>
                  <p className="text-2xl font-display font-bold text-white">
                    {stats.total_referred}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-accent-mint" />
                    <p className="text-xs text-white/60">Заработано</p>
                  </div>
                  <p className="text-2xl font-display font-bold text-accent-mint">
                    {stats.total_earned.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-4 rounded-xl bg-accent-mint/10 border border-accent-mint/20">
                <p className="text-sm text-white/80">
                  <strong className="text-accent-mint">💡 Совет:</strong> Чем больше друзей вы пригласите, тем больше заработаете! 
                  Средний заработок активных рефералов составляет от 5,000₽ до 15,000₽ в месяц.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold hover:shadow-lg hover:shadow-accent-teal/30 transition-all"
              >
                Понятно
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

