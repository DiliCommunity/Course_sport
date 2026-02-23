'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTelegram } from '@/components/providers/TelegramProvider'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { BalanceCard } from '@/components/profile/BalanceCard'
import { ReferralSection } from '@/components/profile/ReferralSection'
import { CoursesList } from '@/components/profile/CoursesList'
import { TransactionsHistory } from '@/components/profile/TransactionsHistory'
import { MyCoursesModal } from '@/components/profile/MyCoursesModal'
import { WalletModal } from '@/components/profile/WalletModal'
import { ReferralModal } from '@/components/profile/ReferralModal'
import { PromocodeSection } from '@/components/profile/PromocodeSection'
import { FreeTrialTimer } from '@/components/profile/FreeTrialTimer'
import { Loader2, Settings, ArrowLeft, Mail, Phone, Save, BookOpen, Wallet, Gift, Bot, Smartphone, Ticket, Shield, Users, CreditCard, Star } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface ProfileData {
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
    avatar_url: string | null
    telegram_id: string | null
    telegram_username: string | null
    is_admin?: boolean
  }
  balance: {
    balance: number
    total_earned: number
    total_withdrawn: number
  }
  enrollments: Array<{
    id: string
    progress: number
    completed_at: string | null
    courses: {
      id: string
      title: string
      image_url: string
      price: number
      duration_minutes: number
      rating: number
      students_count: number
    }
  }>
  referralCode: string
  hasPurchasedCourse: boolean
  referralStats: {
    total_referred: number
    total_earned: number
    active_referrals: number
    completed_referrals: number
  }
  freeTrial: {
    enabled: boolean
    isActive: boolean
    daysRemaining: number
    hoursRemaining: number
    startedAt: string
    expiresAt: string
    apps: string[]
  } | null
  transactions: Array<{
    id: string
    created_at: string
    type: 'earned' | 'withdrawn' | 'spent' | 'refund' | 'referral_commission' | 'referral_bonus'
    amount: number
    description: string
  }>
}

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const { user: telegramUser, isTelegramApp } = useTelegram()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedEmail, setEditedEmail] = useState('')
  const [editedPhone, setEditedPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [isMyCoursesModalOpen, setIsMyCoursesModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [freeTrialFallback, setFreeTrialFallback] = useState<ProfileData['freeTrial'] | null>(null)

  // Проверяем авторизацию ТОЛЬКО по наличию сессии (authUser), не по данным Telegram
  const isAuthenticated = !!authUser
  const currentUserId = authUser?.id

  useEffect(() => {
    if (authLoading) return

    // Если не авторизован - редиректим на страницу входа
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Пытаемся загрузить профиль
    fetchProfileData()
  }, [authLoading, isAuthenticated, currentUserId])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/data', {
        credentials: 'include', // Важно: отправляем cookies
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Пользователь не авторизован - редиректим на страницу входа
          router.push('/login')
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch profile data')
      }

      const data = await response.json()
      
      // Проверяем, что данные принадлежат текущему пользователю
      if (data.user && currentUserId && data.user.id !== currentUserId) {
        console.warn('Profile data mismatch:', data.user.id, 'vs', currentUserId)
        setError('Ошибка: данные профиля не соответствуют текущему пользователю')
        return
      }
      
      setProfileData(data)
      setEditedEmail(data.user.email || '')
      setEditedPhone(data.user.phone || '')

      // Если freeTrial не вернулся из профиля — запрашиваем отдельно
      // (бывает когда auto-enable сработал позже через /apps)
      if (!data.freeTrial) {
        try {
          const trialResp = await fetch('/api/access/free-trial', { credentials: 'include' })
          if (trialResp.ok) {
            const trialData = await trialResp.json()
            if (trialData.hasFreeTrial && trialData.isActive) {
              setFreeTrialFallback({
                enabled: true,
                isActive: true,
                daysRemaining: trialData.daysRemaining,
                hoursRemaining: trialData.hoursRemaining || 0,
                startedAt: trialData.startedAt,
                expiresAt: trialData.expiresAt,
                apps: trialData.apps || [],
              })
            }
          }
        } catch {}
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContact = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: editedEmail,
          phone: editedPhone,
        }),
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить контакты')
      }

      const data = await response.json()
      if (profileData) {
        setProfileData({
          ...profileData,
          user: {
            ...profileData.user,
            email: data.user.email,
            phone: data.user.phone,
          },
        })
      }
      setIsEditing(false)
    } catch (err) {
      console.error('Save contact error:', err)
      alert(err instanceof Error ? err.message : 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        user: {
          ...profileData.user,
          avatar_url: newAvatarUrl,
        },
      })
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка профиля...</p>
        </div>
      </main>
    )
  }

  if (error || !profileData) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Профиль не найден'}</p>
          <Link href="/" className="text-accent-teal hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <AvatarUpload
              currentAvatar={profileData.user.avatar_url}
              userId={profileData.user.id}
              onUploadComplete={handleAvatarUpdate}
            />
            <div className="flex-1">
              <h1 className="font-display font-bold text-4xl text-white mb-2">
                {profileData.user.name || 'Пользователь'}
                {profileData.user.is_admin && (
                  <span className="ml-3 px-3 py-1 text-xs font-semibold rounded-full bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
                    Админ
                  </span>
                )}
              </h1>
              {!isEditing ? (
                <div className="space-y-1">
                  {/* Показываем Telegram username, если пользователь зарегистрирован через Telegram */}
                  {profileData.user.telegram_username && (
                    <p className="text-white/60">✈️ Telegram: @{profileData.user.telegram_username}</p>
                  )}
                  {profileData.user.email && (
                    <p className="text-white/60">📧 {profileData.user.email}</p>
                  )}
                  {profileData.user.phone && (
                    <p className="text-white/60">📱 {profileData.user.phone}</p>
                  )}
                  {/* Если нет ни почты, ни телефона, и нет Telegram username - показываем из контекста */}
                  {!profileData.user.email && !profileData.user.phone && !profileData.user.telegram_username && (
                    <p className="text-white/60">
                      Telegram: @{telegramUser?.username || 'user'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Email</label>
                    <input
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-teal"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Телефон</label>
                    <input
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-teal"
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveContact}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-accent-teal text-dark-900 font-semibold hover:bg-accent-mint transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedEmail(profileData.user.email || '')
                      setEditedPhone(profileData.user.phone || '')
                    }}
                    className="px-4 py-2 rounded-xl glass border border-white/10 hover:border-accent-teal/30 transition-all"
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl glass border border-white/10 hover:border-accent-teal/30 transition-all flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  <span>Редактировать контакты</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setIsMyCoursesModalOpen(true)}
            className="rounded-xl glass border border-white/10 p-6 hover:border-accent-teal/50 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-dark-900" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Мои курсы</p>
                <p className="text-sm text-white/60">{profileData.enrollments?.length || 0} курсов</p>
              </div>
            </div>
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setIsWalletModalOpen(true)}
            className="rounded-xl glass border border-white/10 p-6 hover:border-accent-gold/50 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7 text-dark-900" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Кошелёк</p>
                <p className="text-sm text-white/60">{((profileData.balance?.balance || 0) / 100).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setIsReferralModalOpen(true)}
            className="rounded-xl glass border border-white/10 p-6 hover:border-accent-flame/50 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-flame to-accent-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-7 h-7 text-dark-900" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Заработать</p>
                <p className="text-sm text-white/60">+{((profileData.referralStats?.total_earned || 0) / 100).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </motion.button>

          <Link
            href="/apps"
            className="rounded-xl glass border border-white/10 p-6 hover:border-accent-electric/50 transition-all group text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-electric to-accent-neon flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7 text-dark-900" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Приложения</p>
                <p className="text-sm text-white/60">Инструменты</p>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Admin Quick Actions */}
        {profileData.user.is_admin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-accent-gold/20 text-accent-gold text-sm">👑 Админ</span>
              Панель управления
            </h2>
            
            {/* Main Admin Panel Button */}
            <Link
              href="/admin"
              className="group relative block w-full mb-4 p-6 rounded-2xl bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-orange-500/30 border-2 border-accent-gold/50 hover:border-accent-gold hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-gold via-accent-flame to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Shield className="w-9 h-9 text-dark-900" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white flex items-center gap-2">
                      🎛️ Админ-панель
                      <span className="animate-pulse">✨</span>
                    </p>
                    <p className="text-white/60">Статистика, пользователи, платежи, отзывы</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3 text-white/40">
                  <Users className="w-5 h-5" />
                  <CreditCard className="w-5 h-5" />
                  <Star className="w-5 h-5" />
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="rounded-xl glass border border-white/10 p-4 hover:border-blue-400/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Пользователи</p>
                    <p className="text-xs text-white/50">Управление</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/payments"
                className="rounded-xl glass border border-white/10 p-4 hover:border-green-400/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Платежи</p>
                    <p className="text-xs text-white/50">История</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/reviews"
                className="rounded-xl glass border border-white/10 p-4 hover:border-yellow-400/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Отзывы</p>
                    <p className="text-xs text-white/50">Модерация</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/promocodes"
                className="rounded-xl glass border border-white/10 p-4 hover:border-accent-flame/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-flame to-accent-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Ticket className="w-6 h-6 text-dark-900" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Промокоды</p>
                    <p className="text-xs text-white/50">Создание</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <p className="text-sm text-white/60 mb-1">Куплено курсов</p>
            <p className="text-3xl font-display font-bold text-white">
              {profileData.enrollments?.length || 0}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <p className="text-sm text-white/60 mb-1">Завершено</p>
            <p className="text-3xl font-display font-bold text-accent-mint">
              {profileData.enrollments?.filter((e) => e.progress === 100).length || 0}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <p className="text-sm text-white/60 mb-1">Приглашено друзей</p>
            <p className="text-3xl font-display font-bold text-accent-teal">
              {profileData.referralStats?.total_referred || 0}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <p className="text-sm text-white/60 mb-1">Заработано</p>
            <p className="text-3xl font-display font-bold text-accent-gold">
              {((profileData.referralStats?.total_earned || 0) / 100).toLocaleString('ru-RU')} ₽
            </p>
          </motion.div>
        </div>

        {/* Free Trial Timer */}
        {(profileData.freeTrial || freeTrialFallback) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <FreeTrialTimer freeTrial={(profileData.freeTrial || freeTrialFallback)!} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BalanceCard
              balance={profileData.balance?.balance || 0}
              totalEarned={profileData.balance?.total_earned || 0}
              totalWithdrawn={profileData.balance?.total_withdrawn || 0}
            />
          </motion.div>

          {/* Referral Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <ReferralSection
              referralCode={profileData.referralCode || ''}
              hasPurchasedCourse={profileData.hasPurchasedCourse || false}
              stats={profileData.referralStats || { total_referred: 0, total_earned: 0, active_referrals: 0, completed_referrals: 0 }}
            />
          </motion.div>
        </div>

        {/* Promocode Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <PromocodeSection 
            onReferralActivated={() => {
              // Перезагружаем страницу для обновления данных реферальной системы
              window.location.reload()
            }}
          />
        </motion.div>

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-white">Мои курсы</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMyCoursesModalOpen(true)}
                className="text-accent-teal hover:text-accent-mint transition-colors text-sm font-medium"
              >
                Все курсы →
              </button>
            </div>
          </div>
          <CoursesList enrollments={profileData.enrollments || []} />
        </motion.div>

        {/* AI Instructor Section */}
        {profileData.hasPurchasedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="rounded-xl glass border border-white/10 p-6 bg-gradient-to-r from-accent-teal/10 to-accent-mint/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-teal to-accent-mint flex items-center justify-center">
                  <Bot className="w-6 h-6 text-dark-900" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white">Мой инструктор</h2>
                  <p className="text-white/60 text-sm">AI-помощник по кето-диете и интервальному голоданию</p>
                </div>
              </div>
              <p className="text-white/70 mb-4 text-sm">
                Получите персональные рекомендации, ответы на вопросы и поддержку от вашего AI-инструктора
              </p>
              <Link href="/instructor">
                <Button className="w-full sm:w-auto">
                  Открыть чат с инструктором
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Transactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-display font-bold text-2xl text-white mb-6">История транзакций</h2>
          <TransactionsHistory transactions={profileData.transactions || []} />
        </motion.div>
      </div>

      {/* Modals */}
      <MyCoursesModal
        isOpen={isMyCoursesModalOpen}
        onClose={() => setIsMyCoursesModalOpen(false)}
      />
      
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        balance={profileData.balance?.balance || 0}
        totalEarned={profileData.balance?.total_earned || 0}
        totalWithdrawn={profileData.balance?.total_withdrawn || 0}
      />
      
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        referralCode={profileData.referralCode || ''}
        hasPurchasedCourse={profileData.hasPurchasedCourse || false}
        stats={profileData.referralStats || { total_referred: 0, total_earned: 0, active_referrals: 0, completed_referrals: 0 }}
      />
    </main>
  )
}
