'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { 
  Star, ArrowLeft, Loader2, CheckCircle, XCircle, 
  Clock, RefreshCw, ChevronLeft, ChevronRight, 
  MessageSquare, User, Calendar, Trash2
} from 'lucide-react'

interface Review {
  id: string
  user_id: string
  course_id: string
  course_name: string
  rating: number
  text: string
  user_name: string
  is_verified: boolean
  is_approved: boolean
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    averageRating: 0
  })

  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const perPage = 10

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

    fetchReviews()
  }, [user, authLoading, router, page, filter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        filter
      })
      
      const response = await fetch(`/api/admin/reviews?${params}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить отзывы')
      }
      
      const data = await response.json()
      setReviews(data.reviews || [])
      setTotalPages(data.totalPages || 1)
      setStats(data.stats || { total: 0, pending: 0, approved: 0, averageRating: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const approveReview = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const response = await fetch('/api/admin/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, approve: true })
      })

      if (!response.ok) throw new Error('Ошибка')
      
      fetchReviews()
    } catch (err) {
      alert('Ошибка при одобрении отзыва')
    } finally {
      setActionLoading(null)
    }
  }

  const rejectReview = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const response = await fetch('/api/admin/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, approve: false })
      })

      if (!response.ok) throw new Error('Ошибка')
      
      fetchReviews()
    } catch (err) {
      alert('Ошибка при отклонении отзыва')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Удалить этот отзыв навсегда?')) return

    setActionLoading(reviewId)
    try {
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Ошибка')
      
      fetchReviews()
    } catch (err) {
      alert('Ошибка при удалении отзыва')
    } finally {
      setActionLoading(null)
    }
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
                <Star className="w-8 h-8 text-yellow-400" />
                Модерация отзывов
              </h1>
              <p className="text-white/60 mt-1">
                Одобряйте и управляйте отзывами пользователей
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-white/50">Всего</div>
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
                <div className="text-xs text-white/50">На модерации</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
                <div className="text-xs text-white/50">Одобрено</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl glass border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{stats.averageRating.toFixed(1)}</div>
                <div className="text-xs text-white/50">Средний рейтинг</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setFilter('pending'); setPage(1) }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              filter === 'pending' 
                ? 'bg-yellow-500/30 text-yellow-300' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4" />
            На модерации ({stats.pending})
          </button>
          <button
            onClick={() => { setFilter('approved'); setPage(1) }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              filter === 'approved' 
                ? 'bg-green-500/30 text-green-300' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Одобренные
          </button>
          <button
            onClick={() => { setFilter('all'); setPage(1) }}
            className={`px-4 py-2 rounded-xl transition-all ${
              filter === 'all' 
                ? 'bg-white/20 text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Все
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            {error}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-electric animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Отзывы не найдены</p>
            </div>
          ) : (
            reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl glass border border-white/10 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-electric to-accent-neon flex items-center justify-center text-dark-900 font-bold">
                        {review.user_name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {review.user_name}
                          {review.is_anonymous && (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-xs">
                              Анонимно
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/40">
                          {review.course_name}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= review.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-white/20'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-white/60 text-sm">
                        {review.rating}/5
                      </span>
                    </div>

                    {/* Text */}
                    <p className="text-white/80 mb-3">{review.text}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.created_at)}
                      </span>
                      {review.is_approved ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Одобрен
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Clock className="w-3 h-3" />
                          На модерации
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!review.is_approved && (
                      <button
                        onClick={() => approveReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === review.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Одобрить
                      </button>
                    )}
                    {review.is_approved && (
                      <button
                        onClick={() => rejectReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Скрыть
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review.id)}
                      disabled={actionLoading === review.id}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
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
            onClick={fetchReviews}
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

