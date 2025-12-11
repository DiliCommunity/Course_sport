'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Play, ArrowRight, Sparkles, Users, Star, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { icon: Users, value: '50K+', label: 'Студентов' },
  { icon: Star, value: '4.9', label: 'Рейтинг' },
  { icon: Trophy, value: '200+', label: 'Курсов' },
]

const floatingIcons = [
  { emoji: '🏋️', delay: 0, x: '10%', y: '20%' },
  { emoji: '🧘', delay: 0.5, x: '85%', y: '15%' },
  { emoji: '🥊', delay: 1, x: '75%', y: '70%' },
  { emoji: '🏃', delay: 1.5, x: '15%', y: '75%' },
  { emoji: '💪', delay: 2, x: '90%', y: '45%' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Animated gradient blobs */}
      <div className="hero-blob w-[600px] h-[600px] bg-accent-electric/20 -top-64 -left-32" />
      <div className="hero-blob w-[500px] h-[500px] bg-accent-neon/15 -bottom-32 -right-32" style={{ animationDelay: '2s' }} />
      <div className="hero-blob w-[400px] h-[400px] bg-accent-flame/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '4s' }} />
      
      {/* Floating emojis */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl pointer-events-none select-none hidden lg:block"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.6, 
            scale: 1,
            y: [0, -20, 0],
          }}
          transition={{
            opacity: { delay: item.delay, duration: 0.5 },
            scale: { delay: item.delay, duration: 0.5 },
            y: { delay: item.delay, duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-gold" />
            <span className="text-sm text-white/80">Новые курсы каждую неделю</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight mb-6"
          >
            <span className="text-white">Прокачай </span>
            <span className="gradient-text">своё тело</span>
            <br />
            <span className="text-white">с лучшими </span>
            <span className="gradient-text-gold">тренерами</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Профессиональные онлайн-курсы по фитнесу, йоге, единоборствам 
            и другим видам спорта. Начни трансформацию уже сегодня!
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/courses">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Начать обучение
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="secondary" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                Смотреть видео
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 sm:gap-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-accent-electric" />
                </div>
                <div className="text-left">
                  <div className="font-display font-bold text-2xl text-white">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ height: ['20%', '60%', '20%'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 bg-accent-electric rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

