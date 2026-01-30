'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { 
  Users, ArrowLeft, Search, Filter, Loader2, 
  Shield, ShieldOff, UserCog, Mail, Phone, Calendar,
  RefreshCw, ChevronLeft, ChevronRight, MoreVertical,
  Eye, Ban, CheckCircle, XCircle, Crown, Handshake,
  MessageCircle, Globe, Key, Clock
} from 'lucide-react'

interface User {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  username: string | null
  is_admin: boolean
  is_referral_partner: boolean
  referral_code: string | null
  referral_commission_percent: number | null
  registration_method: string | null
  telegram_id: string | null
  telegram_username: string | null
  vk_id: string | null
  avatar_url: string | null
  created_at: string
  last_login: string | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination & Search
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admins' | 'partners'>('all')
  const perPage = 20

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

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

    fetchUsers()
  }, [user, authLoading, router, page, filter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        filter,
        ...(search && { search })
      })
      
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить пользователей')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
      setTotalUsers(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(currentStatus 
      ? 'Снять права администратора?' 
      : 'Назначить администратором?'
    )) return

    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, isAdmin: !currentStatus })
      })

      if (!response.ok) throw new Error('Ошибка')
      
      fetchUsers()
    } catch (err) {
      alert('Ошибка при изменении статуса')
    } finally {
      setActionLoading(null)
    }
  }

  const togglePartner = async (userId: string, currentStatus: boolean) => {
    if (!confirm(currentStatus 
      ? 'Отключить реферальную программу?' 
      : 'Включить реферальную программу?'
    )) return

    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users/toggle-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, isPartner: !currentStatus })
      })

      if (!response.ok) throw new Error('Ошибка')
      
      fetchUsers()
    } catch (err) {
      alert('Ошибка при изменении статуса')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getRegistrationMethodBadge = (method: string | null, telegramId: string | null, vkId: string | null) => {
    // Определяем метод по данным
    let displayMethod = method
    if (!displayMethod) {
      if (telegramId) displayMethod = 'telegram'
      else if (vkId) displayMethod = 'vk'
      else displayMethod = 'unknown'
    }

    switch (displayMethod) {
      case 'telegram':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1 w-fit">
            <MessageCircle className="w-3 h-3" />
            Telegram
          </span>
        )
      case 'vk':
        return (
          <span className="px-2 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center gap-1 w-fit">
            <Globe className="w-3 h-3" />
            VK
          </span>
        )
      case 'phone':
        return (
          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center gap-1 w-fit">
            <Phone className="w-3 h-3" />
            Телефон
          </span>
        )
      case 'email':
        return (
          <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center gap-1 w-fit">
            <Mail className="w-3 h-3" />
            Email
          </span>
        )
      case 'password':
      case 'login':
        return (
          <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center gap-1 w-fit">
            <Key className="w-3 h-3" />
            Логин
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs flex items-center gap-1 w-fit">
            <Globe className="w-3 h-3" />
            Web
          </span>
        )
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
                <Users className="w-8 h-8 text-blue-400" />
                Пользователи
              </h1>
              <p className="text-white/60 mt-1">
                Всего: {totalUsers} пользователей
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по email, телефону или имени..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-accent-electric text-dark-900 font-bold hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all"
            >
              Найти
            </button>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => { setFilter('all'); setPage(1) }}
              className={`px-4 py-3 rounded-xl transition-all ${
                filter === 'all' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => { setFilter('admins'); setPage(1) }}
              className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
                filter === 'admins' 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Crown className="w-4 h-4" />
              Админы
            </button>
            <button
              onClick={() => { setFilter('partners'); setPage(1) }}
              className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
                filter === 'partners' 
                  ? 'bg-pink-500/30 text-pink-300' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Handshake className="w-4 h-4" />
              Партнёры
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-xl glass border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Пользователь</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Контакты</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Метод</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Дата</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-accent-electric animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      Пользователи не найдены
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-electric to-accent-neon flex items-center justify-center text-dark-900 font-bold">
                            {(u.name || u.username || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {u.name || u.username || 'Без имени'}
                              {u.is_admin && (
                                <Crown className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                            <div className="text-xs text-white/40 font-mono">
                              {u.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {u.email && (
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Mail className="w-4 h-4 text-white/40" />
                              <span className="truncate max-w-[150px]">{u.email}</span>
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Phone className="w-4 h-4 text-white/40" />
                              {u.phone}
                            </div>
                          )}
                          {u.telegram_username && (
                            <div className="flex items-center gap-2 text-sm text-blue-400">
                              <MessageCircle className="w-4 h-4" />
                              @{u.telegram_username}
                            </div>
                          )}
                          {!u.email && !u.phone && !u.telegram_username && (
                            <span className="text-white/30">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRegistrationMethodBadge(u.registration_method, u.telegram_id, u.vk_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {u.is_admin && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3" />
                              Админ
                            </span>
                          )}
                          {u.is_referral_partner && (
                            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs flex items-center gap-1 w-fit">
                              <Handshake className="w-3 h-3" />
                              Партнёр {u.referral_commission_percent}%
                            </span>
                          )}
                          {!u.is_admin && !u.is_referral_partner && (
                            <span className="text-white/30 text-xs">Пользователь</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-white/40" />
                            <span className="text-xs">{formatDate(u.created_at)}</span>
                          </div>
                          {u.last_login && (
                            <div className="flex items-center gap-2 text-white/40">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">Был: {formatDate(u.last_login)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleAdmin(u.id, u.is_admin)}
                            disabled={actionLoading === u.id || u.id === user?.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
                              u.is_admin 
                                ? 'hover:bg-red-500/20 text-red-400' 
                                : 'hover:bg-purple-500/20 text-purple-400'
                            }`}
                            title={u.is_admin ? 'Снять админа' : 'Сделать админом'}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : u.is_admin ? (
                              <ShieldOff className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => togglePartner(u.id, u.is_referral_partner)}
                            disabled={actionLoading === u.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
                              u.is_referral_partner 
                                ? 'hover:bg-red-500/20 text-red-400' 
                                : 'hover:bg-pink-500/20 text-pink-400'
                            }`}
                            title={u.is_referral_partner ? 'Отключить партнёрку' : 'Включить партнёрку'}
                          >
                            <Handshake className="w-4 h-4" />
                          </button>
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
            onClick={fetchUsers}
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

