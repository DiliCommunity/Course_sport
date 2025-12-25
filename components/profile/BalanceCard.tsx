'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { WalletModal } from './WalletModal'

interface BalanceCardProps {
  balance: number
  totalEarned: number
  totalWithdrawn: number
}

export function BalanceCard({ balance = 0, totalEarned = 0, totalWithdrawn = 0 }: BalanceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass border border-white/10 p-6 cursor-pointer hover:border-accent-teal/30 transition-all"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsModalOpen(true)
        }}
      >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-transparent to-accent-mint/10" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint flex items-center justify-center">
              <Wallet className="w-6 h-6 text-dark-900" />
            </div>
            <div>
              <p className="text-sm text-white/60">Баланс</p>
              <p className="text-2xl font-display font-bold text-white">
                {balance.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
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
    </motion.div>
    <WalletModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      balance={balance}
      totalEarned={totalEarned}
      totalWithdrawn={totalWithdrawn}
    />
    </>
  )
}
