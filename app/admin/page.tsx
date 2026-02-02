'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, CreditCard, Ticket, Star, 
  BookOpen, ChefHat, TrendingUp, TrendingDown, Eye,
  Loader2, RefreshCw, ArrowRight, Calendar, DollarSign,
  UserPlus, ShoppingCart, Activity, BarChart3, PieChart,
  Settings, MessageSquare, Bell, Shield, Clock
} from 'lucide-react'

interface DashboardStats {
  users: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    admins: number
    referralPartners: number
  }
  payments: {
    total: number
    completed: number
    pending: number
    totalRevenue: number
    todayRevenue: number
    thisMonthRevenue: number
  }
  courses: {
    totalEnrollments: number
    ketoEnrollments: number
    intervalEnrollments: number
  }
  promocodes: {
    total: number
    active: number
    totalActivations: number
  }
  reviews: {
    total: number
    pending: number
    approved: number
    averageRating: number
  }
  recentActivity: Array<{
    type: string
    message: string
    time: string
  }>
}

const initialStats: DashboardStats = {
  users: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, admins: 0, referralPartners: 0 },
  payments: { total: 0, completed: 0, pending: 0, totalRevenue: 0, todayRevenue: 0, thisMonthRevenue: 0 },
  courses: { totalEnrollments: 0, ketoEnrollments: 0, intervalEnrollments: 0 },
  promocodes: { total: 0, active: 0, totalActivations: 0 },
  reviews: { total: 0, pending: 0, approved: 0, averageRating: 0 },
  recentActivity: []
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.is_admin) {
      router.push('/')
      return
    }

    fetchStats()
  }, [user, authLoading, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить статистику')
      }
      
      const data = await response.json()
      setStats(data.stats || initialStats)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount / 100)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  if (authLoading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-electric animate-spin" />
      </main>
    )
  }

  if (!user?.is_admin) {
    return null
  }

  const menuItems = [
    {
      title: 'Промокоды',
      description: 'Создание и управление скидками',
      icon: Ticket,
      href: '/admin/promocodes',
      color: 'from-purple-500 to-pink-500',
      stats: `${stats.promocodes.active} активных`
    },
    {
      title: 'Пользователи',
      description: 'Управление аккаунтами',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-cyan-500',
      stats: `${formatNumber(stats.users.total)} всего`
    },
    {
      title: 'Платежи',
      description: 'История транзакций',
      icon: CreditCard,
      href: '/admin/payments',
      color: 'from-green-500 to-emerald-500',
      stats: `${stats.payments.completed} успешных`
    },
    {
      title: 'Отзывы',
      description: 'Модерация отзывов',
      icon: Star,
      href: '/admin/reviews',
      color: 'from-yellow-500 to-orange-500',
      stats: `${stats.reviews.pending} на модерации`
    },
    {
      title: 'Рецепты',
      description: 'Личный шеф - контент',
      icon: ChefHat,
      href: '/admin/recipes',
      color: 'from-rose-500 to-red-500',
      stats: '100+ рецептов'
    }
  ]

  const statCards: Array<{
    title: string
    value: string
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
    icon: typeof Users
    color: string
    bgColor: string
  }> = [
    {
      title: 'Всего пользователей',
      value: formatNumber(stats.users.total),
      change: `+${stats.users.today} сегодня`,
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Выручка за месяц',
      value: formatCurrency(stats.payments.thisMonthRevenue),
      change: `${formatCurrency(stats.payments.todayRevenue)} сегодня`,
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Записей на курсы',
      value: formatNumber(stats.courses.totalEnrollments),
      change: `Кето: ${stats.courses.ketoEnrollments}, IF: ${stats.courses.intervalEnrollments}`,
      changeType: 'neutral',
      icon: BookOpen,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Средний рейтинг',
      value: stats.reviews.averageRating.toFixed(1),
      change: `${stats.reviews.approved} отзывов`,
      changeType: 'positive',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ]

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-neon flex items-center justify-center">
                <Shield className="w-7 h-7 text-dark-900" />
              </div>
              Панель администратора
            </h1>
            <p className="text-white/60 mt-2">
              Добро пожаловать, {user?.name || user?.username || 'Админ'}! 
              {lastUpdated && (
                <span className="ml-2 text-white/40">
                  Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl glass border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                {card.changeType === 'positive' && (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                )}
                {card.changeType === 'negative' && (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </div>
              <div className="text-sm text-white/60">{card.title}</div>
              <div className={`text-xs mt-2 ${
                card.changeType === 'positive' ? 'text-green-400' : 
                card.changeType === 'negative' ? 'text-red-400' : 'text-white/40'
              }`}>
                {card.change}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="rounded-xl glass border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-accent-electric">{stats.users.thisWeek}</div>
            <div className="text-xs text-white/50">За неделю</div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-accent-neon">{stats.users.thisMonth}</div>
            <div className="text-xs text-white/50">За месяц</div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.users.admins}</div>
            <div className="text-xs text-white/50">Админов</div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-pink-400">{stats.users.referralPartners}</div>
            <div className="text-xs text-white/50">Партнёров</div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.promocodes.totalActivations}</div>
            <div className="text-xs text-white/50">Промо активаций</div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.payments.pending}</div>
            <div className="text-xs text-white/50">Ожидают оплаты</div>
          </div>
        </div>

        {/* Menu Grid */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-white/60" />
          Управление
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link
                href={item.href}
                className="group block rounded-2xl glass border border-white/10 p-6 hover:border-white/30 hover:shadow-[0_0_30px_rgba(0,217,255,0.1)] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/50 mb-3">{item.description}</p>
                <div className="text-xs text-accent-electric font-medium">{item.stats}</div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Overview */}
          <div className="rounded-2xl glass border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Выручка
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <div className="text-sm text-white/50">Всего</div>
                  <div className="text-xl font-bold text-white">{formatCurrency(stats.payments.totalRevenue)}</div>
                </div>
                <DollarSign className="w-8 h-8 text-green-400/50" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <div className="text-sm text-white/50">Этот месяц</div>
                  <div className="text-xl font-bold text-green-400">{formatCurrency(stats.payments.thisMonthRevenue)}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400/50" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <div className="text-sm text-white/50">Сегодня</div>
                  <div className="text-xl font-bold text-accent-electric">{formatCurrency(stats.payments.todayRevenue)}</div>
                </div>
                <Calendar className="w-8 h-8 text-accent-electric/50" />
              </div>
            </div>
          </div>

          {/* Course Distribution */}
          <div className="rounded-2xl glass border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Распределение по курсам
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Кето диета</span>
                  <span className="text-white font-bold">{stats.courses.ketoEnrollments}</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ 
                      width: `${stats.courses.totalEnrollments > 0 
                        ? (stats.courses.ketoEnrollments / stats.courses.totalEnrollments * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Интервальное голодание</span>
                  <span className="text-white font-bold">{stats.courses.intervalEnrollments}</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ 
                      width: `${stats.courses.totalEnrollments > 0 
                        ? (stats.courses.intervalEnrollments / stats.courses.totalEnrollments * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Всего записей</span>
                  <span className="text-2xl font-bold text-white">{stats.courses.totalEnrollments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl glass border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-electric" />
            Последняя активность
          </h3>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Нет недавней активности</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {activity.type === 'user' && <UserPlus className="w-5 h-5" />}
                    {activity.type === 'payment' && <ShoppingCart className="w-5 h-5" />}
                    {activity.type === 'review' && <Star className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-white/40 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

