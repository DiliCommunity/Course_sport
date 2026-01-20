'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTelegram } from '@/components/providers/TelegramProvider'
import { useAuth } from '@/components/providers/AuthProvider'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTelegramLoading, setIsTelegramLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const router = useRouter()
  const { isTelegramApp, user: telegramUser, isReady } = useTelegram()
  const { user, loading: authLoading, refreshUser } = useAuth()

  // Если пользователь уже авторизован - редирект на курсы
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/courses')
    }
  }, [authLoading, user, router])

  // Авторизация через Telegram (создаст нового пользователя или войдёт)
  const handleTelegramAuth = async () => {
    if (!telegramUser) return
    
    setIsTelegramLoading(true)
    setError(null)

    try {
      // Получаем реферальный код из URL или sessionStorage
      const urlParams = new URLSearchParams(window.location.search)
      const referralCode = urlParams.get('ref') || sessionStorage.getItem('pending_referral')
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          photo_url: telegramUser.photo_url,
          referralCode: referralCode || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации через Telegram')
      }

      // Удаляем использованный реферальный код
      if (referralCode) {
        sessionStorage.removeItem('pending_referral')
      }

      setSuccess(true)
      await refreshUser()
      
      setTimeout(() => {
        router.push('/courses')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации через Telegram')
      setIsTelegramLoading(false)
    }
  }

  // Регистрация по логину/паролю
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Валидация
    if (!username || username.length < 3) {
      setError('Логин должен быть минимум 3 символа')
      return
    }

    if (!name) {
      setError('Имя обязательно')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setIsLoading(true)

    try {
      // Получаем реферальный код из URL или sessionStorage
      const urlParams = new URLSearchParams(window.location.search)
      const referralCode = urlParams.get('ref') || sessionStorage.getItem('pending_referral')

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          name,
          email: email || null,
          phone: phone || null,
          referralCode: referralCode || null,
          // Если мы в Telegram - связываем аккаунт сразу
          telegram_id: isTelegramApp && telegramUser ? String(telegramUser.id) : null,
          telegram_username: isTelegramApp && telegramUser ? telegramUser.username : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации')
      }

      // Удаляем использованный реферальный код
      sessionStorage.removeItem('pending_referral')

      setSuccess(true)
      await refreshUser()
      
      setTimeout(() => {
        router.push('/courses')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации. Попробуйте снова.')
      setIsLoading(false)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
  if (authLoading || !isReady) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center px-4 pb-20">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60">Проверка авторизации...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-electric/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-neon/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-neon p-0.5">
                <div className="w-full h-full rounded-[10px] bg-dark-900 flex items-center justify-center">
                  <span className="text-3xl">💚</span>
                </div>
              </div>
              <span className="font-display font-bold text-2xl">
                <span className="text-white">Course</span>
                <span className="gradient-text">Sport</span>
              </span>
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl text-white mb-2">
              Создать аккаунт
            </h1>
            <p className="text-white/60">
              Начни свой путь к идеальной форме
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-accent-neon/10 border border-accent-neon/30 flex items-center gap-3 mb-6"
            >
              <CheckCircle2 className="w-5 h-5 text-accent-neon flex-shrink-0" />
              <p className="text-sm text-accent-neon">
                Регистрация успешна! Перенаправляем...
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Telegram Quick Register (if in Telegram and not showing form) */}
          {isTelegramApp && telegramUser && !showRegisterForm ? (
            <div className="space-y-6">
              {/* Telegram User Info */}
              <div className="p-4 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30">
                <div className="flex items-center gap-3 mb-2">
                  <Send className="w-5 h-5 text-[#0088cc]" />
                  <span className="font-semibold text-white">Telegram аккаунт</span>
                </div>
                <p className="text-white/60 text-sm">
                  {telegramUser.first_name} {telegramUser.last_name || ''}
                  {telegramUser.username && ` (@${telegramUser.username})`}
                </p>
              </div>

              {/* Register with Telegram */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleTelegramAuth}
                isLoading={isTelegramLoading}
                disabled={success}
              >
                <Send className="w-5 h-5 mr-2" />
                Зарегистрироваться через Telegram
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Show register form button */}
              <button
                onClick={() => setShowRegisterForm(true)}
                className="w-full p-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-colors text-center"
              >
                Создать аккаунт с логином и паролем
              </button>
            </div>
          ) : (
            <>
              {/* Back to Telegram button (if in Telegram) */}
              {isTelegramApp && telegramUser && showRegisterForm && (
                <button
                  onClick={() => setShowRegisterForm(false)}
                  className="mb-6 text-accent-electric hover:underline text-sm flex items-center gap-2"
                >
                  ← Вернуться к регистрации через Telegram
                </button>
              )}

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-white/70">
                    Логин <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите логин"
                      className="input pl-12"
                      required
                      minLength={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-white/70">
                    Имя <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ваше имя"
                      className="input pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-white/70">
                    Пароль <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-12 pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70">
                    Подтвердите пароль <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-12 pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Опциональные поля */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-4">
                    📧 Email и телефон — необязательно (для уведомлений)
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-white/70">
                        Email (необязательно)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="input pl-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-white/70">
                        Телефон (необязательно)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+7 (999) 123-45-67"
                          className="input pl-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  isLoading={isLoading}
                  disabled={success}
                >
                  Зарегистрироваться
                </Button>
              </form>
            </>
          )}

          {/* Login Link */}
          <p className="text-center mt-6 text-white/60">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-accent-electric hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  )
}
