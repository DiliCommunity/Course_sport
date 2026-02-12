'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/providers/AuthProvider'
import { useVK } from '@/components/providers/VKProvider'
import { User, ChefHat, Lock } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const { isVKMiniApp, isReady: vkReady } = useVK()
  const router = useRouter()
  const [hasChefAccess, setHasChefAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [videoMuted, setVideoMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Если в VK Mini App и не авторизован - редирект на логин
  useEffect(() => {
    if (vkReady && isVKMiniApp && !loading && !user) {
      console.log('[HomePage] Redirecting to login from VK Mini App')
      router.push('/login')
    }
  }, [isVKMiniApp, vkReady, loading, user, router])

  // Проверяем доступ к Личному шефу (админ или хотя бы одна оплата)
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasChefAccess(false)
        setCheckingAccess(false)
        return
      }

      try {
        const response = await fetch('/api/courses/access?check_purchased=true', {
          credentials: 'include'
        })
        const data = await response.json()
        setHasChefAccess(data.hasPurchased || data.isAdmin)
      } catch (error) {
        console.error('Error checking chef access:', error)
        setHasChefAccess(false)
      } finally {
        setCheckingAccess(false)
      }
    }

    if (!loading) {
      checkAccess()
    }
  }, [user, loading])

  return (
    <>
      {/* Баннер с подарком */}
      <section className="relative py-4 bg-gradient-to-r from-accent-gold/20 via-accent-electric/20 to-accent-gold/20 border-b-2 border-accent-gold/40 pt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-center">
            <div className="text-2xl animate-bounce">🎁</div>
            <div className="flex-1">
              <p className="text-sm md:text-base font-bold text-white">
                <span className="bg-gradient-to-r from-accent-gold via-accent-electric to-accent-gold bg-clip-text text-transparent">
                  После оплаты первого курса — Личный шеф в подарок!
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

      {/* Большая кнопка регистрации для неавторизованных пользователей */}
      {!user && !loading && (
        <section className="py-6 md:py-8">
          <div className="container mx-auto px-4">
            <Link
              href="/register"
              className="group relative flex flex-col items-center justify-center gap-3 mx-auto w-full max-w-4xl px-6 md:px-12 py-6 md:py-8 rounded-3xl bg-gradient-to-r from-accent-violet via-accent-electric to-accent-neon bg-[length:200%_100%] animate-gradient shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:shadow-[0_0_80px_rgba(139,92,246,0.8),0_0_60px_rgba(0,217,255,0.6)] hover:scale-[1.02] transition-all duration-300 border-2 border-accent-violet/60 hover:border-accent-electric"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-accent-violet via-accent-electric to-accent-neon opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300" />
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-3xl md:text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">👨‍🍳</span>
                  <span className="relative text-white font-black text-xl md:text-2xl lg:text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.3)] bg-gradient-to-r from-white via-accent-electric to-white bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                    Попробуй личный шеф!
                  </span>
                </div>
                <div className="text-base md:text-lg lg:text-xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.2)]">
                  И начни зарабатывать на нём уже сегодня!
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2 text-sm md:text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] opacity-90 group-hover:opacity-100 transition-opacity">
                <span className="bg-gradient-to-r from-white to-accent-electric bg-clip-text text-transparent">Зарегистрироваться</span>
                <span className="group-hover:translate-x-1 transition-transform text-accent-electric drop-shadow-[0_0_10px_rgba(0,217,255,0.8)]">→</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Кнопка "Мой профиль" для авторизованных пользователей */}
      {user && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <Link
              href="/profile"
              className="group relative flex items-center justify-center gap-3 mx-auto w-fit px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-electric via-accent-neon to-accent-electric bg-[length:200%_100%] animate-gradient text-dark-900 font-bold text-lg shadow-[0_0_30px_rgba(0,217,255,0.5)] hover:shadow-[0_0_50px_rgba(0,217,255,0.8)] hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent-electric via-accent-neon to-accent-electric opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              <User className="relative w-6 h-6" />
              <span className="relative">👤 Мой профиль</span>
              <span className="relative animate-pulse">✨</span>
            </Link>
          </div>
        </section>
      )}

      {/* Social Links */}
      <section className="py-4">
        <div className="container mx-auto px-4">
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

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background image (keto_full2) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/keto_full2.jpg"
            alt="Keto background"
            fill
            priority
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/40 via-dark-900/70 to-dark-900/95" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Promo Video */}
            <div className="relative mb-8 mx-auto max-w-4xl group">
              <div className="relative rounded-2xl overflow-hidden border-2 border-accent-gold/50 shadow-[0_0_40px_rgba(255,215,0,0.3)] group-hover:border-accent-electric group-hover:shadow-[0_0_60px_rgba(0,217,255,0.5)] transition-all duration-500">
                {/* Gradient overlay for professional look */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 via-transparent to-accent-electric/10 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent z-10 pointer-events-none" />
                
                {/* Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted={videoMuted}
                  playsInline
                  className="w-full h-auto max-h-[400px] md:max-h-[500px] object-cover"
                  poster="/img/keto_full2.jpg"
                >
                  <source src="/img/Keto_life.mp4" type="video/mp4" />
                </video>
                
                {/* Sound control button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setVideoMuted(!videoMuted)
                    if (videoRef.current) {
                      videoRef.current.muted = !videoMuted
                    }
                  }}
                  className="absolute bottom-4 right-4 z-20 p-3 bg-dark-900/80 hover:bg-dark-900 rounded-full border border-accent-gold/50 hover:border-accent-electric transition-all duration-300 group/btn"
                  aria-label={videoMuted ? "Включить звук" : "Выключить звук"}
                >
                  {videoMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold group-hover/btn:text-accent-electric transition-colors">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold group-hover/btn:text-accent-electric transition-colors">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  )}
                </button>
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-accent-gold/20 via-accent-electric/20 to-accent-neon/20 blur-xl" />
                </div>
                
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-accent-gold/50 rounded-tl-2xl opacity-60" />
                <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-accent-electric/50 rounded-tr-2xl opacity-60" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-accent-neon/50 rounded-bl-2xl opacity-60" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-accent-gold/50 rounded-br-2xl opacity-60" />
              </div>
              
              {/* Badge overlay */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                <div className="px-6 py-2 bg-gradient-to-r from-accent-gold via-accent-electric to-accent-neon rounded-full text-dark-900 font-bold text-sm md:text-base shadow-[0_4px_20px_rgba(255,215,0,0.4)] animate-pulse">
                  🎯 15% контента бесплатно
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-accent-electric to-accent-neon bg-clip-text text-transparent">
                Кето-диета и интервальное голодание
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Премиум обучение от лучших экспертов. 15% контента бесплатно, полный доступ за 1699₽
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
            
            <div className="flex justify-center gap-8 md:gap-16 mb-8">
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

      {/* Personal Chef Banner */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {hasChefAccess ? (
            <Link 
              href="/recipes"
              className="group relative flex items-center justify-between overflow-hidden rounded-3xl border-2 border-accent-neon/50 hover:border-accent-neon transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,255,136,0.3)]"
            >
              {/* Background with multiple food images */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Grid of food images */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 opacity-50">
                  <div className="relative">
                    <Image src="/img/recipes/grilled-salmon-fillet.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/keto-burger.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/grilled-beef-steak.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/keto-cheesecake.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/grilled-chicken-breast-vegetables.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/keto-caesar-salad.jpg" alt="" fill className="object-cover" />
                  </div>
                </div>
                {/* Overlay gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900/95 via-dark-900/85 to-dark-900/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-accent-neon/30 via-transparent to-accent-electric/20" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent-gold/10" />
              </div>
              
              <div className="relative z-10 flex items-center gap-6 p-6 md:p-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-accent-neon via-accent-electric to-accent-gold rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,255,136,0.5)] group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-10 h-10 md:w-12 md:h-12 text-dark-900" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                    <span className="bg-gradient-to-r from-accent-neon via-accent-electric to-accent-gold bg-clip-text text-transparent">
                      🍳 Личный Шеф
                    </span>
                  </h3>
                  <p className="text-white/70 text-sm md:text-base max-w-md">
                    100+ кето-рецептов с фото • Генератор меню • Персональные планы питания
                  </p>
                </div>
              </div>
              
              <div className="relative z-10 hidden md:flex items-center gap-3 pr-8">
                <span className="text-accent-neon font-bold text-lg group-hover:translate-x-2 transition-transform duration-300">
                  Открыть
                </span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-3xl animate-pulse bg-gradient-to-r from-accent-neon/20 via-accent-electric/20 to-accent-gold/20" />
              </div>
            </Link>
          ) : (
            <div className="relative flex items-center justify-between overflow-hidden rounded-3xl border-2 border-white/10 bg-glass">
              {/* Background with food images (dimmed) */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Grid of food images - dimmed */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 opacity-10">
                  <div className="relative">
                    <Image src="/img/recipes/grilled-salmon-fillet.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/keto-burger.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/grilled-beef-steak.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/keto-cheesecake.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/grilled-chicken-breast-vegetables.jpg" alt="" fill className="object-cover" />
                  </div>
                  <div className="relative">
                    <Image src="/img/recipes/keto-caesar-salad.jpg" alt="" fill className="object-cover" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900/98 via-dark-900/92 to-dark-900/85" />
              </div>
              
              <div className="relative z-10 flex items-center gap-6 p-6 md:p-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ChefHat className="w-10 h-10 md:w-12 md:h-12 text-white/40" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-white/60 mb-2">
                    🍳 Личный Шеф
                  </h3>
                  <p className="text-white/40 text-sm md:text-base max-w-md">
                    Доступно после покупки любого курса
                  </p>
                </div>
              </div>
              
              <div className="relative z-10 flex items-center gap-3 pr-8">
                <Lock className="w-6 h-6 text-white/30" />
                <Link 
                  href="/courses"
                  className="px-6 py-3 bg-gradient-to-r from-accent-electric to-accent-neon text-dark-900 font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.5)] transition-all duration-300"
                >
                  Купить курс
                </Link>
              </div>
            </div>
          )}
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
              <p className="text-white/60">Полный доступ к курсу всего за 1699₽, 15% контента бесплатно</p>
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
