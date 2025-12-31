'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ShoppingCart, Gift, TrendingUp } from 'lucide-react'

interface Transaction {
  id: string
  created_at: string
  type: 'earned' | 'withdrawn' | 'spent' | 'refund'
  amount: number
  description: string
}

interface TransactionsHistoryProps {
  transactions: Transaction[]
}

const typeConfig = {
  earned: { icon: TrendingUp, color: 'text-accent-mint', bg: 'bg-accent-mint/10', label: 'Заработано' },
  withdrawn: { icon: ArrowDownLeft, color: 'text-white/60', bg: 'bg-white/5', label: 'Выведено' },
  spent: { icon: ShoppingCart, color: 'text-white/60', bg: 'bg-white/5', label: 'Потрачено' },
  refund: { icon: ArrowUpRight, color: 'text-accent-teal', bg: 'bg-accent-teal/10', label: 'Возврат' },
}

export function TransactionsHistory({ transactions = [] }: TransactionsHistoryProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl glass border border-white/10">
        <p className="text-white/60">История транзакций пуста</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => {
        const transactionType = transaction.type as keyof typeof typeConfig
        const config = typeConfig[transactionType] || typeConfig.spent // Fallback на spent если тип неизвестен
        
        if (!config || !config.icon) {
          console.warn('Invalid transaction type or config:', transaction.type, transaction)
          // Используем дефолтные значения
          const defaultConfig = typeConfig.spent
          const Icon = defaultConfig.icon
          const date = new Date(transaction.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl glass border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${defaultConfig.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${defaultConfig.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{transaction.description}</p>
                <p className="text-xs text-white/50">{date}</p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-bold ${defaultConfig.color}`}>
                  -{((transaction.amount || 0) / 100).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </motion.div>
          )
        }
        
        const Icon = config.icon
        const date = new Date(transaction.created_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        return (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl glass border border-white/10 hover:border-white/20 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{transaction.description}</p>
              <p className="text-xs text-white/50">{date}</p>
            </div>

            <div className="text-right">
              <p className={`text-sm font-bold ${config.color}`}>
                {transaction.type === 'earned' || transaction.type === 'refund' ? '+' : '-'}
                {((transaction.amount || 0) / 100).toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
