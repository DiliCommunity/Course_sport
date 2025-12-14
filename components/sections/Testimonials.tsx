'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Quote, MessageSquare } from 'lucide-react'

const testimonials = [
  {
    id: '1',
    name: 'Анна Иванова',
    role: 'Фитнес-энтузиаст',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    content: 'Курсы на Course Health полностью изменили мой подход к тренировкам. За 3 месяца я достигла результатов, которых не могла добиться годами в зале!',
    rating: 5,
    course: 'Полный курс фитнеса',
  },
  {
    id: '2',
    name: 'Михаил Козлов',
    role: 'Предприниматель',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    content: 'Yoga курс помог мне справиться со стрессом и улучшить осанку. Теперь каждое утро начинаю с практики. Елена — потрясающий инструктор!',
    rating: 5,
    course: 'Йога для гибкости',
  },
  {
    id: '3',
    name: 'Дарья Смирнова',
    role: 'Маркетолог',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
    content: 'Очень удобно заниматься через Telegram. Тренировки короткие, но эффективные. Похудела на 8 кг за 2 месяца кроссфита!',
    rating: 5,
    course: 'Кроссфит',
  },
]

export function Testimonials() {
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
            <MessageSquare className="w-4 h-4 text-accent-teal" />
            <span className="text-sm text-white/80">Отзывы</span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Что говорят наши <span className="gradient-text">студенты</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Реальные истории успеха от людей, которые уже изменили свою жизнь
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="card h-full p-8 relative"
                whileHover={{ y: -5 }}
              >
                {/* Quote icon */}
                <div className="absolute top-6 right-6 text-white/5">
                  <Quote className="w-12 h-12" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent-cream fill-accent-cream" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-white/80 leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>

                {/* Course badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-sm mb-6">
                  {testimonial.course}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-accent-teal/20">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/50">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

