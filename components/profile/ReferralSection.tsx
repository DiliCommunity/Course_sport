'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link2, Copy, Check, Users, TrendingUp, Gift } from 'lucide-react'
import { ReferralModal } from './ReferralModal'

interface ReferralSectionProps {
  referralCode: string
  hasPurchasedCourse?: boolean
  stats: {
    total_referred: number
    total_earned: number
    active_referrals: number
    completed_referrals: number
  }
}

export function ReferralSection({ 
  referralCode = '', 
  hasPurchasedCourse = false,
  stats = { total_referred: 0, total_earned: 0, active_referrals: 0, completed_referrals: 0 } 
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentCode, setCurrentCode] = useState(referralCode)
  const [error, setError] = useState<string | null>(null)

  const referralUrl = typeof window !== 'undefined' && currentCode
    ? `${window.location.origin}/register?ref=${currentCode}`
    : ''

  // Обновляем код когда он приходит из пропсов
  useEffect(() => {
    if (referralCode && referralCode !== currentCode) {
      setCurrentCode(referralCode)
    }
  }, [referralCode])

  // Генерируем код если его нет но есть покупка
  useEffect(() => {
    if (!currentCode && hasPurchasedCourse && !isGenerating && !referralCode) {
      generateReferralCode()
    }
  }, [hasPurchasedCourse, currentCode, referralCode, isGenerating])

  const generateReferralCode = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/referrals/generate', {
        method: 'POST',
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (data.success && data.referral_code) {
        setCurrentCode(data.referral_code)
      } else if (data.error === 'NO_ELIGIBILITY' || data.error === 'NO_PURCHASE') {
        setError(data.message || 'Реферальная ссылка будет доступна после первой оплаты или применения промокода PARTNER2026')
      } else {
        setError(data.error || 'Ошибка генерации реферального кода')
      }
    } catch (err) {
      console.error('Failed to generate referral code:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl glass border border-white/10 p-6"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 via-transparent to-accent-electric/10" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center">
            <Gift className="w-6 h-6 text-dark-900" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">Реферальная программа</h3>
            <p className="text-sm text-white/60">Приглашайте друзей и получайте 30%</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">Ваша реферальная ссылка</label>
          
          {!hasPurchasedCourse ? (
            // Нет покупок - показываем сообщение
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <span className="text-lg">🔒</span>
                {error || 'Реферальная ссылка будет доступна после покупки первого курса'}
              </p>
            </div>
          ) : isGenerating ? (
            // Генерируем код
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
              <span className="text-white/60 text-sm">Генерация ссылки...</span>
            </div>
          ) : (
            // Показываем ссылку
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
                disabled={!currentCode}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-dark-900 font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] transition-all disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-accent-teal" />
              <p className="text-xs text-white/60">Приглашено</p>
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
              {(stats.total_earned / 100).toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        {/* Заработать Button - с золотой анимацией перелива */}
        <motion.button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsModalOpen(true)
          }}
          type="button"
          className="relative w-full py-4 rounded-xl font-bold text-lg overflow-hidden group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated gold gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-300 via-yellow-500 via-orange-400 to-yellow-400 bg-[length:200%_100%] animate-shimmer" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-white/30 to-yellow-400/0 bg-[length:200%_100%] animate-shimmer opacity-50" />
          
          {/* Inner shadow for depth */}
          <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-b from-yellow-300/20 to-transparent" />
          
          {/* Button content */}
          <span className="relative z-10 flex items-center justify-center gap-2 text-dark-900 drop-shadow-sm">
            <span className="text-xl">💎</span>
            <span>Заработать</span>
          </span>
          
          {/* Outer glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity -z-10" />
        </motion.button>
      </div>
    </motion.div>
    <ReferralModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      referralCode={currentCode}
      hasPurchasedCourse={hasPurchasedCourse}
      stats={stats}
    />
    </>
  )
}
