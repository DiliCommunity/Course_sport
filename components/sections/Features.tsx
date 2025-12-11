'use client'

import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Video, 
  Award, 
  Clock, 
  MessageCircle, 
  Shield,
  Sparkles
} from 'lucide-react'

const features = [
  {
    icon: Video,
    title: 'HD Видео уроки',
    description: 'Профессиональная съёмка с разных ракурсов для идеального понимания техники',
    color: 'electric',
  },
  {
    icon: Smartphone,
    title: 'Telegram Mini App',
    description: 'Учись прямо в Telegram — удобно, быстро и всегда под рукой',
    color: 'neon',
  },
  {
    icon: Award,
    title: 'Сертификаты',
    description: 'Получай официальные сертификаты о прохождении курсов',
    color: 'gold',
  },
  {
    icon: Clock,
    title: 'Гибкий график',
    description: 'Занимайся в любое время — доступ к урокам 24/7',
    color: 'flame',
  },
  {
    icon: MessageCircle,
    title: 'Поддержка тренера',
    description: 'Задавай вопросы и получай обратную связь от экспертов',
    color: 'purple',
  },
  {
    icon: Shield,
    title: 'Гарантия качества',
    description: 'Возврат денег в течение 14 дней, если курс не подойдёт',
    color: 'electric',
  },
]

const colorClasses: Record<string, { bg: string; icon: string; glow: string }> = {
  electric: {
    bg: 'bg-accent-electric/10',
    icon: 'text-accent-electric',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]',
  },
  neon: {
    bg: 'bg-accent-neon/10',
    icon: 'text-accent-neon',
    glow: 'group-hover:shadow-[0_0_30px_rgba(57,255,20,0.2)]',
  },
  gold: {
    bg: 'bg-accent-gold/10',
    icon: 'text-accent-gold',
    glow: 'group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]',
  },
  flame: {
    bg: 'bg-accent-flame/10',
    icon: 'text-accent-flame',
    glow: 'group-hover:shadow-[0_0_30px_rgba(255,107,53,0.2)]',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]',
  },
}

export function Features() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-accent-gold" />
            <span className="text-sm text-white/80">Преимущества</span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Почему <span className="gradient-text-gold">Course Sport?</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Всё, что нужно для эффективных тренировок — в одном месте
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <motion.div
                  className={`card h-full p-8 transition-all duration-500 ${colors.glow}`}
                  whileHover={{ y: -5 }}
                >
                  {/* Icon */}
                  <motion.div
                    className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-6`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <feature.icon className={`w-7 h-7 ${colors.icon}`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="font-display font-bold text-xl text-white mb-3 group-hover:text-accent-electric transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

