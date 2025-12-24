'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Target, Heart, Users, Trophy, Globe, 
  ArrowRight, Star, CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { value: '50K+', label: 'Активных студентов', icon: Users },
  { value: '200+', label: 'Курсов', icon: Trophy },
  { value: '50+', label: 'Тренеров', icon: Star },
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
    description: 'Индивидуальный подход к каждому студенту. Поддержка тренеров на каждом этапе обучения.',
  },
  {
    icon: Heart,
    title: 'Инновации',
    description: 'Используем передовые методики обучения и современные технологии для максимальной эффективности.',
  },
]

const team = [
  {
    name: 'Иван Петров',
    role: 'CEO & Основатель',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Профессиональный спортсмен с 20-летним стажем',
  },
  {
    name: 'Анна Смирнова',
    role: 'Директор по продукту',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Эксперт в образовательных технологиях',
  },
  {
    name: 'Михаил Козлов',
    role: 'Технический директор',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    bio: 'Разработчик с опытом в EdTech',
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
              Мы объединили лучших тренеров мира, чтобы сделать профессиональные тренировки 
              доступными каждому.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/courses">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Начать обучение
                </Button>
              </Link>
              <Link href="/instructors">
                <Button variant="secondary" size="lg">
                  Наши тренеры
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

      {/* Team Section */}
      <section className="py-24 bg-dark-800/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Наша <span className="gradient-text">команда</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Люди, которые стоят за Course Health
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden text-center"
              >
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-xl text-white mb-1">{member.name}</h3>
                  <p className="text-accent-electric mb-2">{member.role}</p>
                  <p className="text-sm text-white/60">{member.bio}</p>
                </div>
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
              <Link href="/courses">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Смотреть курсы
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
