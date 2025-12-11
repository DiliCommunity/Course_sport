'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/courses', label: 'Курсы' },
  { href: '/categories', label: 'Категории' },
  { href: '/instructors', label: 'Тренеры' },
  { href: '/about', label: 'О нас' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent-electric to-accent-neon p-0.5"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full rounded-[10px] bg-dark-900 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent-electric" />
              </div>
            </motion.div>
            <span className="font-display font-bold text-xl tracking-tight">
              <span className="text-white">Course</span>
              <span className="gradient-text">Sport</span>
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
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent-electric transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-white/70 hover:text-white font-medium transition-colors"
            >
              Войти
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/courses"
                className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-semibold text-dark-900 bg-gradient-to-r from-accent-electric to-accent-neon overflow-hidden group"
              >
                <span className="relative z-10">Начать</span>
                <ChevronDown className="w-4 h-4 -rotate-90 relative z-10 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </Link>
            </motion.div>
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-800/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="block py-3 text-lg font-medium text-white/70 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4 border-t border-white/10 space-y-3"
              >
                <Link
                  href="/login"
                  className="flex items-center gap-2 py-3 text-white/70 hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Войти
                </Link>
                <Link
                  href="/courses"
                  className="block w-full py-3 px-4 rounded-xl font-semibold text-center text-dark-900 bg-gradient-to-r from-accent-electric to-accent-neon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Начать обучение
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

