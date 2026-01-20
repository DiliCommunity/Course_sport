'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <main className="min-h-screen pt-20 flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent-flame/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent-electric/10 rounded-full blur-[100px]" />

      <div className="relative text-center max-w-lg">
        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="font-display font-bold text-[150px] sm:text-[200px] leading-none gradient-text opacity-20">
            404
          </span>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 -mt-20"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white">
            Страница не найдена
          </h1>
          <p className="text-xl text-white/60">
            Похоже, эта страница решила отдохнуть от тренировок 🏃‍♂️
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Link href="/">
            <Button size="lg" leftIcon={<Home className="w-5 h-5" />}>
              На главную
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="secondary" size="lg" leftIcon={<Search className="w-5 h-5" />}>
              Искать курсы
            </Button>
          </Link>
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться назад
          </button>
        </motion.div>
      </div>
    </main>
  )
}

