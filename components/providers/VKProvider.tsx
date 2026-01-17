'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface VKUser {
  id: number
  first_name: string
  last_name: string
  photo_200?: string
  photo_100?: string
  domain?: string
}

interface VKWebApp {
  init(userId: number): void
  send(method: string, params?: Record<string, any>): Promise<any>
  getUserInfo(): Promise<VKUser>
  getAccessToken(): Promise<string>
  openAuth(url: string): Promise<any>
  showStoryBox(params: any): void
  allowNotifications(): void
  denyNotifications(): void
  openApp(options: { app_id: number; location?: string }): void
  close(result?: any): void
  addToHomeScreen(): void
  expand(): void
  scroll(top: number, speed?: number): void
  getVersion(): string
  getClientVersion(): string
  isVersionAtLeast(version: string): boolean
}

declare global {
  interface Window {
    vk?: VKWebApp
  }
}

interface VKContextType {
  webApp: VKWebApp | null
  user: VKUser | null
  isVKApp: boolean
  isReady: boolean
  accessToken: string | null
}

const VKContext = createContext<VKContextType>({
  webApp: null,
  user: null,
  isVKApp: false,
  isReady: false,
  accessToken: null,
})

export function useVK() {
  return useContext(VKContext)
}

interface VKProviderProps {
  children: ReactNode
}

export function VKProvider({ children }: VKProviderProps) {
  const [webApp, setWebApp] = useState<VKWebApp | null>(null)
  const [user, setUser] = useState<VKUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(true)
      return
    }

    // Проверяем, находимся ли мы в VK Mini App
    const isVKEnvironment = 
      typeof window !== 'undefined' && (
        window.location.hostname.includes('vk.com') || 
        window.location.hostname.includes('vk.ru') ||
        window.location.search.includes('vk_platform') ||
        window.location.search.includes('vk_user_id') ||
        (document.referrer && (document.referrer.includes('vk.com') || document.referrer.includes('vk.ru')))
      )

    if (!isVKEnvironment) {
      setIsReady(true)
      return
    }

    // Инициализация VK Mini App
    const initVK = async () => {
      try {
        // VK Mini App использует window.vkid для SDK версии 2+
        // Или window.VK для старой версии
        const vkid = (window as any).vkid
        const vkOld = (window as any).VK

        if (vkid && vkid.init) {
          // Новая версия SDK (@vkid/sdk)
          try {
            // Инициализируем SDK
            await vkid.init({
              app: Number(process.env.NEXT_PUBLIC_VK_APP_ID || '54424350'),
            })

            // Получаем информацию о пользователе через API
            // VK передает данные через launch params
            const launchParams = new URLSearchParams(window.location.search)
            const userId = launchParams.get('vk_user_id')
            
            if (userId) {
              // Попытка получить данные пользователя
              // В реальном VK Mini App эти данные доступны через SDK
              setUser({
                id: Number(userId),
                first_name: 'Пользователь',
                last_name: 'VK',
                photo_200: undefined,
                photo_100: undefined,
                domain: undefined,
              })
            }

            setWebApp(vkid as any)
          } catch (e) {
            console.log('VK ID SDK init error:', e)
          }
        } else if (vkOld) {
          // Старая версия SDK
          setWebApp(vkOld as any)
        } else if (window.vk) {
          // Альтернативный способ
          setWebApp(window.vk)
        }
      } catch (error) {
        console.error('VK initialization error:', error)
      } finally {
        setIsReady(true)
      }
    }

    // Небольшая задержка для загрузки скрипта
    const timer = setTimeout(() => {
      initVK()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const value: VKContextType = {
    webApp,
    user,
    isVKApp: !!webApp,
    isReady,
    accessToken,
  }

  return (
    <VKContext.Provider value={value}>
      {children}
    </VKContext.Provider>
  )
}
