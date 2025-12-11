'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-electric/10 via-transparent to-accent-neon/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-electric/5 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Glass card */}
          <div className="glass p-12 lg:p-16 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-accent-electric/20 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent-neon/20 rounded-full blur-[80px]" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              {/* Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-electric to-accent-neon mb-8"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Zap className="w-8 h-8 text-dark-900" />
              </motion.div>

              {/* Heading */}
              <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
                Готов начать <span className="gradient-text">трансформацию?</span>
              </h2>

              {/* Subtitle */}
              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
                Присоединяйся к тысячам студентов, которые уже изменили свою жизнь 
                с Course Sport. Первый урок бесплатно!
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/courses">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Начать бесплатно
                  </Button>
                </Link>
                <a
                  href="https://t.me/CourseSportBot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    leftIcon={<Send className="w-5 h-5" />}
                  >
                    Открыть в Telegram
                  </Button>
                </a>
              </div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-white/10"
              >
                <div className="text-center">
                  <div className="font-display font-bold text-3xl text-white">50K+</div>
                  <div className="text-sm text-white/50">Активных студентов</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-3xl text-white">200+</div>
                  <div className="text-sm text-white/50">Курсов</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-3xl text-white">4.9★</div>
                  <div className="text-sm text-white/50">Средний рейтинг</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-3xl text-white">24/7</div>
                  <div className="text-sm text-white/50">Доступ к урокам</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

