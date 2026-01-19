'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Target, Heart, Users, Trophy, Globe, 
  ArrowRight, CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { value: '50K+', label: 'Активных студентов', icon: Users },
  { value: '200+', label: 'Курсов', icon: Trophy },
  { value: '30+', label: 'Стран', icon: Globe },
]

const values = [
  {
    icon: Target,
    title: 'Результат',
    description: 'Мы фокусируемся на реальных результатах. Каждый курс создан для достижения конкретных целей.',
  },
  {
    icon: Heart,
    title: 'Забота',
    description: 'Индивидуальный подход к каждому студенту. Поддержка на каждом этапе обучения.',
  },
  {
    icon: Heart,
    title: 'Инновации',
    description: 'Используем передовые методики обучения и современные технологии для максимальной эффективности.',
  },
]


export default function AboutPage() {
  return (
    <main className="min-h-screen pt-28 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
              Мы меняем подход к <span className="gradient-text">спортивному образованию</span>
            </h1>
            <p className="text-xl text-white/60 mb-8 leading-relaxed">
              Course Health — это платформа нового поколения для онлайн-обучения спорту и фитнесу. 
              Мы предлагаем профессиональные курсы, чтобы сделать качественное обучение 
              доступным каждому.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/courses">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Начать обучение
                </Button>
              </Link>
              <Link href="/keto-food">
                <Button variant="secondary" size="lg">
                  Кето-рецепты
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800"
                alt="Команда Course Health"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
            </div>
            
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-6 p-6 rounded-2xl glass"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-electric/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent-electric" />
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-white">#1</div>
                  <div className="text-sm text-white/60">в СНГ по спорту</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-dark-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-electric/10 mb-4">
                  <stat.icon className="w-7 h-7 text-accent-electric" />
                </div>
                <div className="font-display font-bold text-4xl text-white mb-2">{stat.value}</div>
                <div className="text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              href="https://t.me/+K8r3s-HNmKAyMTFi" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 text-white/80 hover:bg-[#0088cc]/30 hover:border-[#0088cc]/60 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-sm font-medium">Наш Telegram канал</span>
            </Link>
            <Link 
              href="https://vk.com/coursehealth" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0077FF]/20 border border-[#0077FF]/40 text-white/80 hover:bg-[#0077FF]/30 hover:border-[#0077FF]/60 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.287-.033.435-.2c.136-.15.132-.432.132-.432s-.02-1.305.58-1.498c.594-.19 1.354.95 2.16 1.37.605.315 1.064.245 1.064.245l2.15-.031s1.123-.07.59-.955c-.044-.07-.31-.65-1.61-1.84-1.36-1.24-1.178-.52.45-1.59.99-.82 1.39-1.32 1.26-1.53-.118-.19-.85-.14-.85-.14l-2.19.014s-.162-.022-.282.05c-.118.07-.193.23-.193.23s-.35.93-.81 1.72c-.97 1.64-1.36 1.73-1.52 1.63-.37-.2-.28-.8-.28-1.23 0-1.34.21-1.9-.41-2.04-.2-.05-.35-.08-.86-.09-.66-.01-1.22.01-1.54.2-.21.12-.37.38-.27.4.12.02.39.07.53.26.18.24.18.78.18.78s.11 1.63-.26 1.83c-.26.13-.61-.14-1.37-1.63-.39-.75-.68-1.58-.68-1.58s-.06-.15-.16-.23c-.12-.09-.29-.12-.29-.12l-2.08.014s-.31.01-.43.15c-.1.12-.01.38-.01.38s1.58 3.74 3.37 5.63c1.64 1.72 3.51 1.61 3.51 1.61h.84z"/>
              </svg>
              <span className="text-sm font-medium">Наша группа ВКонтакте</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Наша <span className="gradient-text-gold">миссия</span>
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Сделать качественное спортивное образование доступным для каждого человека, 
              независимо от его местоположения и уровня подготовки.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-electric to-accent-neon mb-6">
                  <value.icon className="w-8 h-8 text-dark-900" />
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-4">{value.title}</h3>
                <p className="text-white/60 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl glass p-12 lg:p-16 text-center"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent-electric/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-neon/20 rounded-full blur-[100px]" />
            
            <div className="relative">
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-6">
                Готов присоединиться?
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
                Начни свой путь к идеальной форме вместе с Course Health уже сегодня
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/courses">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Смотреть курсы
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
