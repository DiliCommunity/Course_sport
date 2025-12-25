'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link2, Copy, Check, Users, TrendingUp, Gift } from 'lucide-react'
import { ReferralModal } from './ReferralModal'

interface ReferralSectionProps {
  referralCode: string
  stats: {
    total_referred: number
    total_earned: number
    active_referrals: number
    completed_referrals: number
  }
}

export function ReferralSection({ referralCode = '', stats = { total_referred: 0, total_earned: 0, active_referrals: 0, completed_referrals: 0 } }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-dark-900 font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] transition-all"
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
              {stats.total_earned.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        {/* Заработать Button */}
        <motion.button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsModalOpen(true)
          }}
          type="button"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-dark-900 font-bold shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          💎 Заработать
        </motion.button>
      </div>
    </motion.div>
    <ReferralModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      referralCode={referralCode}
      stats={stats}
    />
    </>
  )
}
