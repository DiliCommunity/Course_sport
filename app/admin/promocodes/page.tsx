'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  Ticket, Plus, Edit2, Trash2, Check, X, Loader2, 
  ArrowLeft, Calendar, Users, Percent, DollarSign,
  Copy, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Promocode {
  id: string
  code: string
  discount_percent: number
  discount_amount: number
  max_activations: number
  current_activations: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  description: string | null
  course_id: string | null
  course?: { id: string; title: string } | null
  created_at: string
}

interface FormData {
  code: string
  discountPercent: number
  discountAmount: number
  maxActivations: number
  description: string
  courseId: string
  validFrom: string
  validUntil: string
  isActive: boolean
}

const initialFormData: FormData = {
  code: '',
  discountPercent: 0,
  discountAmount: 0,
  maxActivations: 20,
  description: '',
  courseId: '',
  validFrom: '',
  validUntil: '',
  isActive: true
}

export default function AdminPromocodesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [promocodes, setPromocodes] = useState<Promocode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromocode, setEditingPromocode] = useState<Promocode | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

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

    fetchPromocodes()
  }, [user, authLoading, router])

  const fetchPromocodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/promocodes/admin', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить промокоды')
      }
      
      const data = await response.json()
      setPromocodes(data.promocodes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code }))
  }

  const openCreateModal = () => {
    setEditingPromocode(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const openEditModal = (promocode: Promocode) => {
    setEditingPromocode(promocode)
    setFormData({
      code: promocode.code,
      discountPercent: promocode.discount_percent,
      discountAmount: promocode.discount_amount / 100, // Конвертируем из копеек
      maxActivations: promocode.max_activations,
      description: promocode.description || '',
      courseId: promocode.course_id || '',
      validFrom: promocode.valid_from ? promocode.valid_from.slice(0, 16) : '',
      validUntil: promocode.valid_until ? promocode.valid_until.slice(0, 16) : '',
      isActive: promocode.is_active
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.code.trim()) {
      alert('Введите код промокода')
      return
    }

    setSaving(true)
    try {
      const method = editingPromocode ? 'PATCH' : 'POST'
      const body = {
        ...(editingPromocode && { id: editingPromocode.id }),
        code: formData.code,
        discountPercent: formData.discountPercent,
        discountAmount: Math.round(formData.discountAmount * 100), // Конвертируем в копейки
        maxActivations: formData.maxActivations,
        description: formData.description || null,
        courseId: formData.courseId || null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
        isActive: formData.isActive
      }

      const response = await fetch('/api/promocodes/admin', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка сохранения')
      }

      setIsModalOpen(false)
      fetchPromocodes()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот промокод?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/promocodes/admin?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Ошибка удаления')
      }

      fetchPromocodes()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleting(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // Можно добавить toast уведомление
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white/60" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Ticket className="w-8 h-8 text-accent-flame" />
                Управление промокодами
              </h1>
              <p className="text-white/60 mt-1">Создавайте и управляйте промокодами для скидок</p>
            </div>
          </div>
          
          <button
            onClick={openCreateModal}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Создать промокод
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            {error}
          </div>
        )}

        {/* Promocodes Table */}
        <div className="rounded-xl glass border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Код</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Скидка</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Активации</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Действует до</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Описание</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Действия</th>
                </tr>
              </thead>
              <tbody>
                {promocodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      Промокоды не найдены. Создайте первый!
                    </td>
                  </tr>
                ) : (
                  promocodes.map((promo) => (
                    <tr key={promo.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{promo.code}</span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                            title="Копировать"
                          >
                            <Copy className="w-4 h-4 text-white/40" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {promo.discount_percent > 0 ? (
                          <span className="flex items-center gap-1 text-accent-electric">
                            <Percent className="w-4 h-4" />
                            {promo.discount_percent}%
                          </span>
                        ) : promo.discount_amount > 0 ? (
                          <span className="flex items-center gap-1 text-accent-gold">
                            <DollarSign className="w-4 h-4" />
                            {(promo.discount_amount / 100).toLocaleString('ru-RU')} ₽
                          </span>
                        ) : (
                          <span className="text-white/40">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-white/40" />
                          <span className="text-white">
                            {promo.current_activations} / {promo.max_activations}
                          </span>
                          {promo.current_activations >= promo.max_activations && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                              Исчерпан
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {promo.is_active ? (
                          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                            Активен
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                            Неактивен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {formatDate(promo.valid_until)}
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm max-w-[200px] truncate">
                        {promo.description || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(promo)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4 text-accent-electric" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            disabled={deleting === promo.id}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Удалить"
                          >
                            {deleting === promo.id ? (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
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

        {/* Refresh Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchPromocodes}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl glass border border-white/10 p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-6">
                {editingPromocode ? 'Редактировать промокод' : 'Создать промокод'}
              </h2>

              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm text-white/60 mb-1">Код промокода *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="KETO2026"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60"
                      title="Сгенерировать"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Discount Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Скидка в %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Фикс. скидка (₽)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-electric"
                    />
                  </div>
                </div>

                {/* Max Activations */}
                <div>
                  <label className="block text-sm text-white/60 mb-1">Макс. активаций</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxActivations}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxActivations: parseInt(e.target.value) || 20 }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-electric"
                  />
                </div>

                {/* Validity Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Действует с</label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Действует до</label>
                    <input
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-electric"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-white/60 mb-1">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Скидка 15% на все курсы"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric resize-none"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/60">Активен</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.isActive ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {editingPromocode ? 'Сохранить' : 'Создать'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

