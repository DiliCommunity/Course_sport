'use client'

import { useEffect, useState, ReactNode } from 'react'

interface TelegramGateProps {
  children: ReactNode
}

/**
 * TelegramGate - ключевой компонент для разделения Telegram и браузера.
 * 
 * Логика:
 * 1. Проверяем, есть ли window.Telegram.WebApp.initData
 * 2. Если НЕТ - редиректим на HTML версию сайта
 * 3. Если ЕСТЬ - показываем Next.js приложение
 * 
 * Это решает проблему конфликта между Next.js и HTML версиями.
 */
export function TelegramGate({ children }: TelegramGateProps) {
  const [state, setState] = useState<'loading' | 'telegram' | 'browser'>('loading')

  useEffect(() => {
    // Проверяем наличие Telegram WebApp
    const checkTelegram = () => {
      // Если у нас уже есть Telegram WebApp
      if (window.Telegram?.WebApp?.initData) {
        setState('telegram')
        return
      }

      // Проверяем, загружен ли скрипт Telegram
      const script = document.querySelector('script[src*="telegram-web-app.js"]')
      
      if (!script) {
        // Скрипт ещё не загружен - загружаем
        const tgScript = document.createElement('script')
        tgScript.src = 'https://telegram.org/js/telegram-web-app.js'
        tgScript.async = true
        tgScript.onload = () => {
          // После загрузки скрипта даём ещё 300ms на инициализацию
          setTimeout(() => {
            if (window.Telegram?.WebApp?.initData) {
              setState('telegram')
            } else {
              setState('browser')
            }
          }, 300)
        }
        tgScript.onerror = () => {
          setState('browser')
        }
        document.head.appendChild(tgScript)
      } else {
        // Скрипт загружен, но нет initData - значит обычный браузер
        setTimeout(() => {
          if (window.Telegram?.WebApp?.initData) {
            setState('telegram')
          } else {
            setState('browser')
          }
        }, 500)
      }
    }

    checkTelegram()
  }, [])

  // Редирект на HTML версию для обычных браузеров
  useEffect(() => {
    if (state === 'browser') {
      const path = window.location.pathname
      
      // Мапинг Next.js путей на HTML файлы
      const htmlPages: Record<string, string> = {
        '/': '/index.html',
        '/login': '/login.html',
        '/register': '/register.html',
        '/profile': '/profile.html',
        '/courses': '/courses.html',
        '/keto-food': '/keto-food.html',
      }

      // Находим соответствующий HTML файл или редиректим на главную
      const htmlPath = htmlPages[path] || '/index.html'
      window.location.replace(htmlPath)
    }
  }, [state])

  // Показываем загрузку пока проверяем
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60 text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Показываем пустую страницу при редиректе
  if (state === 'browser') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-accent-electric border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60 text-sm">Перенаправление...</p>
        </div>
      </div>
    )
  }

  // Telegram - показываем приложение
  return <>{children}</>
}

