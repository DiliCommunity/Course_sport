'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Send, AlertCircle, User, CheckCircle2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTelegram } from '@/components/providers/TelegramProvider'
import { useVK } from '@/components/providers/VKProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTelegramLoading, setIsTelegramLoading] = useState(false)
  const [isVKLoading, setIsVKLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const { isTelegramApp, user: telegramUser, isReady: tgReady } = useTelegram()
  const { isVKApp, user: vkUser, isReady: vkReady } = useVK()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()

  // Если пользователь уже авторизован - редирект на курсы
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/courses')
    }
  }, [authLoading, user, router])

  // Авторизация через VK
  const handleVKAuth = async () => {
    if (!vkUser) return
    
    setIsVKLoading(true)
    setError(null)

    try {
      const referralCode = typeof window !== 'undefined' ? sessionStorage.getItem('pending_referral') : null
      
      const response = await fetch('/api/auth/vk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: vkUser.id,
          first_name: vkUser.first_name,
          last_name: vkUser.last_name,
          photo_200: vkUser.photo_200,
          photo_100: vkUser.photo_100,
          domain: vkUser.domain,
          referralCode: referralCode || null,
        }),
      })
      
      if (referralCode && response.ok) {
        sessionStorage.removeItem('pending_referral')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка авторизации через VK')
      }

      setSuccess(data.isNewUser ? 'Регистрация успешна!' : 'Вход выполнен!')
      
      await new Promise(resolve => setTimeout(resolve, 800))
      window.location.href = '/profile'
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации через VK')
      setIsVKLoading(false)
    }
  }

  // Авторизация через Telegram
  const handleTelegramAuth = async () => {
    if (!telegramUser) return
    
    setIsTelegramLoading(true)
    setError(null)

    try {
      // Получаем реферальный код из sessionStorage (если есть)
      const referralCode = typeof window !== 'undefined' ? sessionStorage.getItem('pending_referral') : null
      
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
      
      // Если реферальный код был использован - удаляем его
      if (referralCode && response.ok) {
        sessionStorage.removeItem('pending_referral')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка авторизации через Telegram')
      }

      setSuccess(data.isNewUser ? 'Регистрация успешна!' : 'Вход выполнен!')
      
      // Ждём немного, чтобы cookies установились
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Используем window.location для полной перезагрузки страницы с новыми cookies
      window.location.href = '/profile'
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации через Telegram')
      setIsTelegramLoading(false)
    }
  }

  // Вход по логину/паролю
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа')
      }

      // Если мы в Telegram - связываем аккаунт с Telegram ID
      if (isTelegramApp && telegramUser) {
        try {
          await fetch('/api/profile/link-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              telegram_id: String(telegramUser.id),
              telegram_username: telegramUser.username,
            }),
          })
        } catch (linkError) {
          console.log('Could not link Telegram account:', linkError)
        }
      }

      setSuccess('Вход выполнен успешно!')
      await refreshUser()
      
      setTimeout(() => {
        router.push('/courses')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Ошибка входа. Проверьте данные.')
      setIsLoading(false)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
  // В Telegram WebApp ждём инициализации только немного
  if (authLoading || (isTelegramApp && !tgReady) || (isVKApp && !vkReady)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-20">
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
              Добро пожаловать!
            </h1>
            <p className="text-white/60">
              Войдите, чтобы продолжить обучение
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
              <p className="text-sm text-accent-neon">{success}</p>
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

          {/* Показываем выбор способа входа */}
          {!showLoginForm ? (
            <div className="space-y-4">
              {/* Кнопки авторизации через соцсети */}
              <div className="space-y-3">
                {/* Кнопка "Войти через Telegram" - если в Telegram WebApp */}
                {isTelegramApp && telegramUser ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleTelegramAuth}
                    isLoading={isTelegramLoading}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Войти через Telegram
                  </Button>
                ) : (
                  // Кнопка "Войти через Telegram" - если НЕ в Telegram (переход на бота)
                  <motion.a
                    href="https://t.me/Course_Sport_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full p-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white">Войти через Telegram</span>
                  </motion.a>
                )}

                {/* Кнопка "Войти через VK" */}
                {isVKApp && vkUser ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleVKAuth}
                    isLoading={isVKLoading}
                    style={{ backgroundColor: '#0077FF', borderColor: '#0077FF' }}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Войти через VK
                  </Button>
                ) : (
                  <motion.a
                    href="https://vk.com/app54424350"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full p-4 rounded-xl hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#0077FF', borderColor: '#0077FF' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white">Войти через VK</span>
                  </motion.a>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Кнопка для перехода на форму логина/пароля */}
              <button
                onClick={() => setShowLoginForm(true)}
                className="w-full p-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-colors text-center"
              >
                У меня есть аккаунт (логин/пароль)
              </button>
            </div>
          ) : (
            <>
              {/* Кнопка "Назад" для возврата к выбору способа входа */}
              <button
                onClick={() => setShowLoginForm(false)}
                className="mb-6 text-accent-electric hover:underline text-sm flex items-center gap-2"
              >
                ← Выбрать другой способ входа
              </button>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-white/70">
                    Логин
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-white/70">
                    Пароль
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  isLoading={isLoading}
                  disabled={success !== null}
                >
                  Войти
                </Button>
              </form>
            </>
          )}

          {/* Register Link */}
          <p className="text-center mt-6 text-white/60">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-accent-electric hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  )
}
