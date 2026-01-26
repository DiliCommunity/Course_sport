'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, ChevronDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTelegram } from '@/components/providers/TelegramProvider'

const navLinks = [
  { href: '/courses', label: 'Курсы' },
  { href: '/recipes', label: 'Рецепты' },
  { href: '/reviews', label: 'Отзывы' },
  { href: '/promotions', label: 'Акции' },
  { href: '/about', label: 'О нас' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { user, signOut } = useAuth()
  const { user: telegramUser, isTelegramApp } = useTelegram()
  
  // Проверяем авторизацию ТОЛЬКО по наличию сессии (user), не по данным Telegram
  // Пользователь должен явно войти через кнопку, даже если Telegram передает данные
  const isAuthenticated = !!user
  const displayName = user?.email?.split('@')[0] || user?.name || user?.username || 'Профиль'

  // Проверяем наличие класса modal-open на body для скрытия Header
  useEffect(() => {
    const checkModalOpen = () => {
      setIsModalOpen(document.body.classList.contains('modal-open'))
    }
    
    // Проверяем сразу
    checkModalOpen()
    
    // Создаем MutationObserver для отслеживания изменений класса body
    const observer = new MutationObserver(checkModalOpen)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Блокируем скролл страницы, когда открыто бургер-меню (чтобы оно не “исчезало” при прокрутке)
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isMobileMenuOpen])

  // Закрываем меню при клике вне его
  useEffect(() => {
    if (!isUserMenuOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isUserMenuOpen])

  // Скрываем Header когда открыта модалка
  if (isModalOpen) {
    return null
  }

  return (
    <header
      className={cn(
        // Safe-area для iOS/VK Mini App: добавляем верхний отступ и увеличиваем общий контейнер хедера,
        // чтобы контент никогда не залезал под системную панель.
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 box-border pt-[env(safe-area-inset-top)] h-[calc(5rem+env(safe-area-inset-top))]',
        isScrolled
          ? 'bg-dark-900/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20">
          {/* Left: Burger Menu (Mobile) */}
          <div className="flex items-center gap-4">
            {/* Стильное бургер меню */}
            <motion.button
              className="md:hidden relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/30 flex flex-col items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-emerald-400" />
              ) : (
                <>
                  <span className="w-5 h-0.5 bg-emerald-400 rounded-full" />
                  <span className="w-4 h-0.5 bg-emerald-400 rounded-full" />
                  <span className="w-5 h-0.5 bg-emerald-400 rounded-full" />
                </>
              )}
            </motion.button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint p-0.5"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-full h-full rounded-[10px] bg-dark-900 flex items-center justify-center">
                  <span className="text-2xl">💚</span>
                </div>
              </motion.div>
              <span className="font-display font-bold text-xl tracking-tight">
                <span className="text-white">Course</span>
                <span className="gradient-text">Health</span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-white/70 hover:text-white font-medium transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent-teal transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </div>

          {/* Right: Auth Button */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              // Авторизованный пользователь - кнопка "Мой профиль"
              <div className="relative user-menu-container">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 border border-emerald-400/40 hover:border-emerald-400/70 shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-400/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 text-sm font-bold hidden sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-emerald-400/60 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-dark-800/95 backdrop-blur-xl border border-emerald-400/20 p-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-400/10 transition-colors text-sm text-white/80 hover:text-emerald-400"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Мой профиль
                      </Link>
                      <Link
                        href="/apps"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-400/10 transition-colors text-sm text-white/80 hover:text-emerald-400"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        📱 Приложения
                      </Link>
                      <Link
                        href="/profile/courses"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-400/10 transition-colors text-sm text-white/80 hover:text-emerald-400"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        📚 Мои курсы
                      </Link>
                      <div className="my-2 border-t border-white/10" />
                      {user && (
                        <button
                          onClick={async () => {
                            await signOut()
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          Выйти
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Не авторизован - яркая кнопка "Войти"
              <Link href="/login">
                <motion.div
                  className="px-5 py-2.5 rounded-xl font-bold text-dark-900 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_20px_rgba(52,211,153,0.5)] hover:shadow-[0_0_35px_rgba(52,211,153,0.7)] transition-all duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="w-4 h-4" />
                  <span>Войти</span>
                </motion.div>
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Menu - ПОЛНОСТЬЮ ФИКСИРОВАННОЕ, открывается в любом месте страницы */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm md:hidden"
          style={{ zIndex: 99999 }}
          onClick={(e) => {
            // Закрываем только при клике на overlay (темный фон)
            if (e.target === e.currentTarget) {
              setIsMobileMenuOpen(false)
            }
          }}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-dark-800 border-r border-emerald-400/20 shadow-[5px_0_30px_rgba(0,0,0,0.5)] overflow-y-auto"
            style={{ zIndex: 100000 }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex flex-col h-full">
                {/* Header с крестиком */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-400/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal to-accent-mint p-0.5">
                      <div className="w-full h-full rounded-[10px] bg-dark-900 flex items-center justify-center">
                        <span className="text-xl">💚</span>
                      </div>
                    </div>
                    <span className="font-display font-bold text-lg">
                      <span className="text-white">Course</span>
                      <span className="gradient-text">Health</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-emerald-400" />
                  </button>
                </div>
                
                {/* Навигационные ссылки - показываем всегда */}
                <div className="px-6 py-8 space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-white/70 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all duration-200 group border border-transparent hover:border-emerald-400/20"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="w-1.5 h-6 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-auto px-6 py-6 border-t border-emerald-400/20 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                        <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-emerald-400 font-bold">{displayName}</div>
                          <div className="text-white/50 text-sm">
                            {isTelegramApp ? 'Telegram' : 'Email'}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-400/10 transition-colors text-white/70 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        Мой профиль
                      </Link>
                      <Link
                        href="/profile/courses"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-400/10 transition-colors text-white/70 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        📚 Мои курсы
                      </Link>
                      {user && (
                        <button
                          onClick={async () => {
                            await signOut()
                            setIsMobileMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 border border-transparent hover:border-red-400/20"
                        >
                          <LogOut className="w-5 h-5" />
                          Выйти
                        </button>
                      )}
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-bold text-dark-900 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Войти
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
    </header>
  )
}
