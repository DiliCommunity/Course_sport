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
import { Loader2, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ProfileData {
  user: {
    id: string
    name: string
    email: string | null
    avatar_url: string | null
    telegram_id: string | null
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
  referralStats: {
    total_referred: number
    total_earned: number
    active_referrals: number
    completed_referrals: number
  }
  transactions: Array<{
    id: string
    created_at: string
    type: 'earned' | 'withdrawn' | 'spent' | 'refund'
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

  const isAuthenticated = authUser || (isTelegramApp && telegramUser)
  const currentUserId = authUser?.id || telegramUser?.id

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

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
          // Пользователь не авторизован
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
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные профиля')
    } finally {
      setLoading(false)
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
          <p className="text-white/60">Загрузка профиля...</p>
        </div>
      </main>
    )
  }

  if (error || !profileData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
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
    <main className="min-h-screen pt-28 pb-16">
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
              </h1>
              <p className="text-white/60">
                {profileData.user.email || `Telegram: @${telegramUser?.username || 'user'}`}
              </p>
            </div>
            <Link
              href="/profile/settings"
              className="px-4 py-2 rounded-xl glass border border-white/10 hover:border-accent-teal/30 transition-all flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              <span>Настройки</span>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl glass border border-white/10 p-4"
          >
            <p className="text-sm text-white/60 mb-1">Куплено курсов</p>
            <p className="text-3xl font-display font-bold text-white">
              {profileData.enrollments.length}
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
              {profileData.enrollments.filter((e) => e.progress === 100).length}
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
              {profileData.referralStats.total_referred}
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
              {profileData.referralStats.total_earned.toLocaleString('ru-RU')} ₽
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BalanceCard
              balance={profileData.balance.balance}
              totalEarned={profileData.balance.total_earned}
              totalWithdrawn={profileData.balance.total_withdrawn}
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
              referralCode={profileData.referralCode}
              stats={profileData.referralStats}
            />
          </motion.div>
        </div>

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-white">Мои курсы</h2>
            <Link
              href="/courses"
              className="text-accent-teal hover:text-accent-mint transition-colors text-sm font-medium"
            >
              Все курсы →
            </Link>
          </div>
          <CoursesList enrollments={profileData.enrollments} />
        </motion.div>

        {/* Transactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-display font-bold text-2xl text-white mb-6">История транзакций</h2>
          <TransactionsHistory transactions={profileData.transactions} />
        </motion.div>
      </div>
    </main>
  )
}
