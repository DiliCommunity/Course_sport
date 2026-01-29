'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { 
  CreditCard, ArrowLeft, Search, Loader2, 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, DollarSign,
  TrendingUp, Filter
} from 'lucide-react'

interface Payment {
  id: string
  user_id: string
  course_id: string
  amount: number
  status: string
  payment_method: string | null
  yookassa_payment_id: string | null
  is_full_access: boolean
  created_at: string
  updated_at: string
  user?: {
    name: string | null
    email: string | null
    phone: string | null
  }
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalRevenue: 0
  })

  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const perPage = 20

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

    fetchPayments()
  }, [user, authLoading, router, page, statusFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/admin/payments?${params}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить платежи')
      }
      
      const data = await response.json()
      setPayments(data.payments || [])
      setTotalPages(data.totalPages || 1)
      setStats(data.stats || { total: 0, completed: 0, pending: 0, totalRevenue: 0 })
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Оплачен
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Ожидает
          </span>
        )
      case 'failed':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Ошибка
          </span>
        )
      case 'canceled':
        return (
          <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Отменён
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/50 text-sm">
            {status}
          </span>
        )
    }
  }

  const getCourseName = (courseId: string) => {
    switch (courseId) {
      case '1': return 'Кето диета'
      case '2': return 'Интервальное голодание'
      case 'bundle': return 'Оба курса'
      default: return `Курс ${courseId}`
    }
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

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white/60" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-green-400" />
                Платежи
              </h1>
              <p className="text-white/60 mt-1">
                История всех транзакций
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-white/50">Всего платежей</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                <div className="text-xs text-white/50">Успешных</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-xs text-white/50">Ожидают</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-xs text-white/50">Выручка</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'completed', 'pending', 'failed', 'canceled'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1) }}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusFilter === status 
                  ? status === 'completed' ? 'bg-green-500/30 text-green-300' :
                    status === 'pending' ? 'bg-yellow-500/30 text-yellow-300' :
                    status === 'failed' ? 'bg-red-500/30 text-red-300' :
                    status === 'canceled' ? 'bg-gray-500/30 text-gray-300' :
                    'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {status === 'all' ? 'Все' :
               status === 'completed' ? 'Оплачены' :
               status === 'pending' ? 'Ожидают' :
               status === 'failed' ? 'Ошибки' : 'Отменены'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            {error}
          </div>
        )}

        {/* Payments Table */}
        <div className="rounded-xl glass border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Пользователь</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Курс</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Сумма</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Дата</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-accent-electric animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      Платежи не найдены
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-white/60">
                          {payment.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">
                            {payment.user?.name || payment.user?.email || 'Аноним'}
                          </div>
                          <div className="text-xs text-white/40">
                            {payment.user?.email || payment.user?.phone || payment.user_id.slice(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/80">
                          {getCourseName(payment.course_id)}
                        </span>
                        {payment.is_full_access && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                            Полный
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white/40" />
                          {formatDate(payment.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-white/50 text-sm">
              Страница {page} из {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Refresh */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>
    </main>
  )
}

