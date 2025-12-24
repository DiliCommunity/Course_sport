'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Heart, Send, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTelegram } from '@/components/providers/TelegramProvider'
import { signIn } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isTelegramApp, user, isReady } = useTelegram()
  const router = useRouter()

  // Автоматическая регистрация через Telegram
  useEffect(() => {
    if (isTelegramApp && user && isReady) {
      handleTelegramAuth()
    }
  }, [isTelegramApp, user, isReady])

  const handleTelegramAuth = async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramUser: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации')
      }

      // Сохраняем данные в localStorage для использования в приложении
      localStorage.setItem('telegram_user_id', data.userId)
      localStorage.setItem('telegram_id', data.telegramId)

      // Перенаправляем на главную
      router.push('/courses')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации через Telegram')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      await signIn(email, password)
      router.push('/courses')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Ошибка входа. Проверьте данные.')
      setIsLoading(false)
    }
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

          {/* Telegram Login (if in Telegram) */}
          {isTelegramApp && user ? (
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-white/60">Регистрация через Telegram...</p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-accent-electric/10 border border-accent-electric/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Send className="w-5 h-5 text-accent-electric" />
                      <span className="font-semibold text-white">Telegram аккаунт</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Вы вошли как {user.first_name} {user.last_name || ''}
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
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleTelegramAuth}
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Продолжить
                  </Button>
                </>
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
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-white/70">
                    Email
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

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded bg-dark-700 border-white/20 text-accent-electric focus:ring-accent-electric/50"
                    />
                    <span className="text-white/70">Запомнить меня</span>
                  </label>
                  <a href="#" className="text-accent-electric hover:underline">
                    Забыли пароль?
                  </a>
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

