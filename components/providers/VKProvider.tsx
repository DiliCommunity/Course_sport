'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Типы для VK Bridge
interface UserInfo {
  id: number
  first_name: string
  last_name?: string
  photo_200?: string
  photo_100?: string
  domain?: string
}

interface VKContextType {
  vkUser: UserInfo | null
  isVKMiniApp: boolean
  isReady: boolean
  initData: string | null
}

const VKContext = createContext<VKContextType>({
  vkUser: null,
  isVKMiniApp: false,
  isReady: false,
  initData: null,
})

export function useVK() {
  return useContext(VKContext)
}

interface VKProviderProps {
  children: ReactNode
}

export function VKProvider({ children }: VKProviderProps) {
  const [vkUser, setVkUser] = useState<UserInfo | null>(null)
  const [isVKMiniApp, setIsVKMiniApp] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [initData, setInitData] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReady(true)
      return
    }

    const initVK = async () => {
      try {
        // Получаем VK Bridge из window (загружается через Script в layout)
        const vkBridge = (window as any).vkBridge || (window as any).bridge
        
        // Проверяем URL параметры для определения VK окружения
        const urlParams = new URLSearchParams(window.location.search)
        const userId = urlParams.get('vk_user_id')
        const isVKEnv = window.location.hostname.includes('vk.com') || 
                       window.location.hostname.includes('vk.ru') ||
                       userId !== null ||
                       document.referrer.includes('vk.com') ||
                       document.referrer.includes('vk.ru')
        
        if (isVKEnv) {
          setIsVKMiniApp(true)
          setInitData(window.location.search)
          
          // Если есть VK Bridge, используем его
          if (vkBridge && typeof vkBridge.send === 'function') {
            try {
              await vkBridge.send('VKWebAppInit')
              
              try {
                const userResult = await vkBridge.send('VKWebAppGetUserInfo')
                if (userResult && userResult.id) {
                  setVkUser(userResult as UserInfo)
                }
              } catch (userError) {
                console.log('Could not get user info via bridge, using URL params')
              }
            } catch (initError) {
              console.log('VKWebAppInit error, using URL params:', initError)
            }
          }
          
          // Получаем данные из URL параметров (fallback или основной способ)
          if (userId) {
            setVkUser({
              id: Number(userId),
              first_name: urlParams.get('vk_user_first_name') || 'Пользователь',
              last_name: urlParams.get('vk_user_last_name') || '',
              photo_200: urlParams.get('vk_user_photo_200') || undefined,
              photo_100: urlParams.get('vk_user_photo_100') || undefined,
              domain: urlParams.get('vk_user_domain') || undefined,
            } as UserInfo)
          }
        }
      } catch (error) {
        console.error('VK Mini App initialization error:', error)
      } finally {
        setIsReady(true)
      }
    }

    // Небольшая задержка для загрузки скрипта VK Bridge
    const timer = setTimeout(() => {
      initVK()
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const value: VKContextType = {
    vkUser,
    isVKMiniApp,
    isReady,
    initData,
  }

  return <VKContext.Provider value={value}>{children}</VKContext.Provider>
}
