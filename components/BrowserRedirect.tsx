'use client'

import { useEffect } from 'react'

export function BrowserRedirect() {
  useEffect(() => {
    // Проверяем, что мы НЕ в Telegram Web App
    const checkTelegram = () => {
      // Ждем загрузки Telegram Web App скрипта
      if (typeof window === 'undefined') return
      
      // Проверяем через несколько способов
      const hasTelegramScript = document.querySelector('script[src*="telegram-web-app.js"]')
      const hasTelegramWebApp = window.Telegram?.WebApp?.initData
      
      // Если скрипт загружается, ждем немного
      if (hasTelegramScript && !hasTelegramWebApp) {
        setTimeout(() => {
          checkAndRedirect()
        }, 1000)
        return
      }
      
      checkAndRedirect()
    }
    
    const checkAndRedirect = () => {
      const isTelegram = window.Telegram?.WebApp?.initData
      
      // Если НЕ в Telegram Web App - редиректим на HTML версию
      if (!isTelegram) {
        const path = window.location.pathname
        const htmlPages: Record<string, string> = {
          '/login': '/login.html',
          '/register': '/register.html',
          '/profile': '/profile.html',
          '/courses': '/courses.html',
        }
        
        if (htmlPages[path]) {
          window.location.replace(htmlPages[path])
        }
      }
    }
    
    checkTelegram()
  }, [])
  
  return null
}

