'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <>
      {/* Баннер с подарком */}
      <section className="relative py-4 bg-gradient-to-r from-accent-gold/20 via-accent-electric/20 to-accent-gold/20 border-b-2 border-accent-gold/40 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="text-2xl animate-bounce">🎁</div>
            <div className="flex-1">
              <p className="text-sm md:text-base font-bold text-white">
                <span className="bg-gradient-to-r from-accent-gold via-accent-electric to-accent-gold bg-clip-text text-transparent">
                  После оплаты первого курса — генератор меню в подарок!
                </span>
              </p>
              <p className="text-xs md:text-sm text-white/70 mt-1">
                С нашими 100+ кето-рецептами с фотографиями и подробными инструкциями
              </p>
            </div>
            <div className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' } as React.CSSProperties}>🎁</div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-accent-gold/20 to-accent-electric/20 border border-accent-gold/40 rounded-full text-sm font-medium text-accent-gold mb-6">
              🎯 15% контента бесплатно
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-accent-electric to-accent-neon bg-clip-text text-transparent">
                Кето-диета и интервальное голодание
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Премиум обучение от лучших экспертов. 15% контента бесплатно, полный доступ за 19₽
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/courses" 
                className="px-8 py-4 bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Смотреть курсы
                <span>→</span>
              </Link>
              <Link 
                href="/about" 
                className="px-8 py-4 border-2 border-white/20 text-white font-bold rounded-xl hover:border-accent-electric hover:text-accent-electric transition-all duration-300"
              >
                Узнать больше
              </Link>
            </div>
            
            <div className="flex justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-accent-electric">50K+</div>
                <div className="text-sm text-white/50">Студентов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-accent-gold">4.9</div>
                <div className="text-sm text-white/50">Рейтинг</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-accent-neon">200+</div>
                <div className="text-sm text-white/50">Курсов</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-electric/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-neon/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent-gold/10 rounded-full blur-3xl" />
      </section>

      {/* Reviews Banner */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <Link 
            href="/reviews"
            className="flex items-center justify-between bg-gradient-to-r from-accent-gold/15 to-accent-electric/15 border-2 border-accent-gold/40 rounded-2xl p-6 hover:translate-y-[-5px] hover:shadow-[0_20px_60px_rgba(255,215,0,0.3)] hover:border-accent-gold transition-all duration-300"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-gold to-accent-electric rounded-2xl flex items-center justify-center text-3xl">
                ⭐
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Отзывы наших студентов</h3>
                <p className="text-white/60">Узнайте, что говорят о нас более 50 000 студентов</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-accent-gold font-bold">
              Смотреть отзывы
              <span>→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-black text-center mb-12">
            Почему выбирают нас
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-glass border border-glass-border rounded-2xl p-8 hover:border-accent-electric transition-all duration-300">
              <div className="w-16 h-16 bg-accent-electric/20 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🎓
              </div>
              <h3 className="text-xl font-bold mb-3">Экспертные курсы</h3>
              <p className="text-white/60">Обучение от сертифицированных специалистов с многолетним опытом</p>
            </div>
            
            <div className="bg-glass border border-glass-border rounded-2xl p-8 hover:border-accent-gold transition-all duration-300">
              <div className="w-16 h-16 bg-accent-gold/20 rounded-2xl flex items-center justify-center text-3xl mb-6">
                💎
              </div>
              <h3 className="text-xl font-bold mb-3">Доступные цены</h3>
              <p className="text-white/60">Полный доступ к курсу всего за 19₽, 15% контента бесплатно</p>
            </div>
            
            <div className="bg-glass border border-glass-border rounded-2xl p-8 hover:border-accent-neon transition-all duration-300">
              <div className="w-16 h-16 bg-accent-neon/20 rounded-2xl flex items-center justify-center text-3xl mb-6">
                📱
              </div>
              <h3 className="text-xl font-bold mb-3">Удобный формат</h3>
              <p className="text-white/60">Учитесь в любое время с любого устройства, включая Telegram</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-accent-electric/20 to-accent-neon/20 border border-accent-electric/40 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
              Готовы начать?
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к более чем 50 000 студентов и начните свой путь к здоровому образу жизни
            </p>
            
            {loading ? (
              <div className="inline-block w-8 h-8 border-3 border-accent-electric border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <Link 
                href="/courses"
                className="inline-block px-8 py-4 bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all duration-300"
              >
                Перейти к курсам
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register"
                  className="px-8 py-4 bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all duration-300"
                >
                  Зарегистрироваться
                </Link>
                <Link 
                  href="/login"
                  className="px-8 py-4 border-2 border-accent-electric text-accent-electric font-bold rounded-xl hover:bg-accent-electric hover:text-dark-900 transition-all duration-300"
                >
                  Войти
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
