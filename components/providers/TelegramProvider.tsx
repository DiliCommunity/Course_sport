'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  phone_number?: string
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isProgressVisible: boolean
    isActive: boolean
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    setText(text: string): void
    setParams(params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }): void
  }
  BackButton: {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  ready(): void
  expand(): void
  close(): void
  sendData(data: string): void
  openLink(url: string): void
  openTelegramLink(url: string): void
  openInvoice(url: string, callback?: (status: string) => void): void
  showPopup(params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text: string }> }, callback?: (buttonId: string) => void): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

interface TelegramContextType {
  webApp: TelegramWebApp | null
  user: TelegramUser | null
  initData: string | null
  isTelegramApp: boolean
  isReady: boolean
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  initData: null,
  isTelegramApp: false,
  isReady: false,
})

export function useTelegram() {
  return useContext(TelegramContext)
}

interface TelegramProviderProps {
  children: ReactNode
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(true)
      return
    }

    // Ждём инициализации Telegram WebApp
    const initTelegram = () => {
      const tg = window.Telegram?.WebApp
      if (tg?.initData) {
        tg.ready()
        tg.expand()
        tg.setHeaderColor('#0a0a0b')
        tg.setBackgroundColor('#0a0a0b')
        setWebApp(tg)
      }
      setIsReady(true)
    }

    // Если скрипт уже загружен - инициализируем сразу
    if (window.Telegram?.WebApp) {
      initTelegram()
    } else {
      // Ждём загрузки скрипта
      const checkInterval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(checkInterval)
          initTelegram()
        }
      }, 100)

      // Timeout на случай если скрипт не загрузится
      setTimeout(() => {
        clearInterval(checkInterval)
        setIsReady(true)
      }, 2000)

      return () => clearInterval(checkInterval)
    }
  }, [])

  const value: TelegramContextType = {
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    initData: webApp?.initData || null,
    isTelegramApp: !!webApp?.initData,
    isReady,
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}
