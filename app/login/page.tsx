'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Send, ArrowRight, AlertCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTelegram } from '@/components/providers/TelegramProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isTelegramApp, user: telegramUser, isReady } = useTelegram()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()

  // Если пользователь уже авторизован - редирект на курсы
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/courses')
    }
  }, [authLoading, user, router])

  // Для Telegram авторизация происходит автоматически в AuthProvider
  // Здесь просто показываем статус

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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

      // Обновляем данные пользователя
      await refreshUser()
      router.push('/courses')
    } catch (err: any) {
      setError(err.message || 'Ошибка входа. Проверьте данные.')
      setIsLoading(false)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
  if (authLoading || (!isReady && isTelegramApp)) {
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
              {isTelegramApp 
                ? 'Автоматический вход через Telegram' 
                : 'Войдите, чтобы продолжить обучение'}
            </p>
          </div>

          {/* Telegram Login (if in Telegram) */}
          {isTelegramApp && telegramUser ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/60">Авторизация через Telegram...</p>
                <p className="text-white/40 text-sm mt-2">
                  {telegramUser.first_name} {telegramUser.last_name || ''}
                </p>
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              {/* Telegram Quick Login */}
              <motion.a
                href="https://t.me/CourseSportBot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full p-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] transition-colors mb-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Send className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Войти через Telegram</span>
              </motion.a>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-sm">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3 mb-4"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

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
