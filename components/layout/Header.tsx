'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Heart, User, ChevronDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTelegram } from '@/components/providers/TelegramProvider'

const navLinks = [
  { href: '/courses', label: 'Курсы' },
  { href: '/keto-food', label: 'Рецепты' },
  { href: '/reviews', label: 'Отзывы' },
  { href: '/about', label: 'О нас' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  const { user, signOut } = useAuth()
  const { user: telegramUser, isTelegramApp } = useTelegram()
  
  // Проверяем авторизацию через Telegram или сессию
  const isAuthenticated = user || (isTelegramApp && telegramUser)
  const displayName = user?.email || telegramUser?.first_name || 'Пользователь'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-dark-900/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20">
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

          {/* Desktop Navigation */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-teal" />
                  </div>
                  <span className="text-white/70 text-sm font-medium">{displayName}</span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl glass p-2"
                    >
                      <Link
                        href="/courses"
                        className="block px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Мои курсы
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Профиль
                      </Link>
                      {user && (
                        <button
                          onClick={async () => {
                            await signOut()
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-red-400 flex items-center gap-2"
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
              <Link
                href="/login"
                className="px-4 py-2 text-white/70 hover:text-white font-medium transition-colors"
              >
                Войти
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-20 bg-dark-900/98 backdrop-blur-2xl z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-80 bg-dark-800/95 backdrop-blur-xl border-r border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {!isTelegramApp && (
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
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="w-1 h-6 bg-accent-teal rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="mt-auto px-6 py-6 border-t border-white/10 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                        <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-accent-teal" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{displayName}</div>
                          <div className="text-white/50 text-sm">
                            {isTelegramApp ? 'Telegram' : 'Email'}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/courses"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="w-1 h-6 bg-accent-teal rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        Мои курсы
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="w-1 h-6 bg-accent-teal rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        Профиль
                      </Link>
                      {user && (
                        <button
                          onClick={async () => {
                            await signOut()
                            setIsMobileMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400"
                        >
                          <LogOut className="w-5 h-5" />
                          Выйти
                        </button>
                      )}
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Войти
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

