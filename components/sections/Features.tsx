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
    description: 'Профессиональная съёмка рецептов и техник для идеального понимания',
    color: 'teal',
  },
  {
    icon: Smartphone,
    title: 'Telegram Mini App',
    description: 'Учись прямо в Telegram — удобно, быстро и всегда под рукой',
    color: 'mint',
  },
  {
    icon: Award,
    title: 'Сертификаты',
    description: 'Получай официальные сертификаты о прохождении курсов',
    color: 'cream',
  },
  {
    icon: Clock,
    title: 'Гибкий график',
    description: 'Занимайся в любое время — доступ к урокам 24/7',
    color: 'mint',
  },
  {
    icon: MessageCircle,
    title: 'Поддержка эксперта',
    description: 'Задавай вопросы и получай обратную связь от экспертов по питанию',
    color: 'aqua',
  },
  {
    icon: Shield,
    title: 'Гарантия качества',
    description: 'Возврат денег в течение 14 дней, если курс не подойдёт',
    color: 'teal',
  },
]

const colorClasses: Record<string, { bg: string; icon: string; glow: string }> = {
  teal: {
    bg: 'bg-accent-teal/10',
    icon: 'text-accent-teal',
    glow: 'group-hover:shadow-[0_0_30px_rgba(45,212,191,0.2)]',
  },
  mint: {
    bg: 'bg-accent-mint/10',
    icon: 'text-accent-mint',
    glow: 'group-hover:shadow-[0_0_30px_rgba(167,243,208,0.2)]',
  },
  cream: {
    bg: 'bg-accent-cream/10',
    icon: 'text-accent-cream',
    glow: 'group-hover:shadow-[0_0_30px_rgba(254,243,226,0.2)]',
  },
  aqua: {
    bg: 'bg-accent-aqua/10',
    icon: 'text-accent-aqua',
    glow: 'group-hover:shadow-[0_0_30px_rgba(103,232,249,0.2)]',
  },
  electric: {
    bg: 'bg-accent-teal/10',
    icon: 'text-accent-teal',
    glow: 'group-hover:shadow-[0_0_30px_rgba(45,212,191,0.2)]',
  },
  neon: {
    bg: 'bg-accent-mint/10',
    icon: 'text-accent-mint',
    glow: 'group-hover:shadow-[0_0_30px_rgba(167,243,208,0.2)]',
  },
  gold: {
    bg: 'bg-accent-cream/10',
    icon: 'text-accent-cream',
    glow: 'group-hover:shadow-[0_0_30px_rgba(254,243,226,0.2)]',
  },
  flame: {
    bg: 'bg-accent-cream/10',
    icon: 'text-accent-cream',
    glow: 'group-hover:shadow-[0_0_30px_rgba(254,243,226,0.2)]',
  },
  purple: {
    bg: 'bg-accent-aqua/10',
    icon: 'text-accent-aqua',
    glow: 'group-hover:shadow-[0_0_30px_rgba(103,232,249,0.2)]',
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
            <Sparkles className="w-4 h-4 text-accent-teal" />
            <span className="text-sm text-white/80">Преимущества</span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Почему <span className="gradient-text-cream">наш курс?</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Всё, что нужно для здорового образа жизни и правильного питания — в одном месте
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
                  <h3 className="font-display font-bold text-xl text-white mb-3 group-hover:text-accent-teal transition-colors">
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

