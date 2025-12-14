'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Heart, UtensilsCrossed } from 'lucide-react'

const courseIntros = [
  {
    id: 'keto',
    title: 'Кето-диета',
    description: 'Изучи основы кето-диеты, научись правильно рассчитывать макросы и составлять меню. Начни свой путь к здоровью и стройности!',
    icon: Heart,
    color: 'teal',
    href: '/courses?search=кето',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    stats: {
      courses: 5,
      students: '12K+',
    },
  },
  {
    id: 'fasting',
    title: 'Интервальное голодание',
    description: 'Освой метод интервального голодания. Узнай, как правильно голодать и получать максимальную пользу для здоровья и похудения.',
    icon: UtensilsCrossed,
    color: 'mint',
    href: '/courses?search=голодание',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    stats: {
      courses: 4,
      students: '8K+',
    },
  },
]

export function CourseIntro() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-teal/30 to-transparent" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Heart className="w-4 h-4 text-accent-teal" />
            <span className="text-sm text-white/80 font-medium">Наши направления</span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            Выбери свой <span className="gradient-text">путь к здоровью</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Кето-диета и интервальное голодание — два мощных инструмента для трансформации твоего здоровья
          </p>
        </motion.div>

        {/* Course Intro Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {courseIntros.map((course, index) => {
            const Icon = course.icon
            const isTeal = course.color === 'teal'
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Link href={course.href} className="block group">
                  <motion.div
                    className={`relative h-full rounded-3xl overflow-hidden card-hover ${
                      isTeal 
                        ? 'bg-gradient-to-br from-accent-teal/10 to-accent-aqua/5' 
                        : 'bg-gradient-to-br from-accent-mint/10 to-accent-cream/5'
                    }`}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="relative p-8 sm:p-10 min-h-[400px] flex flex-col justify-between">
                      {/* Top Section */}
                      <div>
                        {/* Icon */}
                        <motion.div
                          className={`w-16 h-16 rounded-2xl ${
                            isTeal ? 'bg-accent-teal/20' : 'bg-accent-mint/20'
                          } backdrop-blur-sm flex items-center justify-center mb-6 border ${
                            isTeal ? 'border-accent-teal/30' : 'border-accent-mint/30'
                          }`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <Icon className={`w-8 h-8 ${isTeal ? 'text-accent-teal' : 'text-accent-mint'}`} />
                        </motion.div>

                        {/* Title */}
                        <h3 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 group-hover:text-accent-teal transition-colors">
                          {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-white/70 text-lg mb-6 leading-relaxed max-w-md">
                          {course.description}
                        </p>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-white/60">
                            <span className="text-sm font-medium">
                              {course.stats.courses} {course.stats.courses === 1 ? 'курс' : course.stats.courses < 5 ? 'курса' : 'курсов'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <span className="text-sm font-medium">
                              {course.stats.students} студентов
                            </span>
                          </div>
                        </div>
                        <motion.div
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            isTeal
                              ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30 group-hover:bg-accent-teal group-hover:text-dark-900'
                              : 'bg-accent-mint/20 text-accent-mint border border-accent-mint/30 group-hover:bg-accent-mint group-hover:text-dark-900'
                          }`}
                          whileHover={{ x: 5 }}
                        >
                          <span>Смотреть</span>
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

