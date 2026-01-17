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
      let detectedVKMiniApp = false
      let detectedUser: UserInfo | null = null
      
      try {
        // Проверяем VK окружение более надежным способом
        const urlParams = new URLSearchParams(window.location.search)
        const fullUrl = window.location.href
        const hostname = window.location.hostname
        const referrer = document.referrer
        
        // Множественные способы определения VK окружения
        const isVKEnv = 
          hostname.includes('vk.com') || 
          hostname.includes('vk.ru') ||
          fullUrl.includes('vk.com') ||
          fullUrl.includes('vk.ru') ||
          referrer.includes('vk.com') ||
          referrer.includes('vk.ru') ||
          urlParams.has('vk_user_id') ||
          urlParams.has('vk_access_token_settings') ||
          urlParams.has('vk_platform')
        
        console.log('[VKProvider] VK environment check:', {
          hostname,
          hasVkUserId: urlParams.has('vk_user_id'),
          hasVkAccessToken: urlParams.has('vk_access_token_settings'),
          hasVkPlatform: urlParams.has('vk_platform'),
          referrer,
          isVKEnv
        })
        
        if (isVKEnv) {
          detectedVKMiniApp = true
          setIsVKMiniApp(true)
          setInitData(window.location.search)
          
          // Ждем немного и пытаемся найти VK Bridge (VK загружает его автоматически)
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Пытаемся получить VK Bridge разными способами
          let vkBridge = null
          
          // Способ 1: VK автоматически загружает bridge как window.bridge или через @vkid/sdk
          if ((window as any).bridge && typeof (window as any).bridge.send === 'function') {
            vkBridge = (window as any).bridge
          }
          // Способ 2: из @vkontakte/vk-bridge (если загружен через наш скрипт)
          else if ((window as any).vkBridge && typeof (window as any).vkBridge.send === 'function') {
            vkBridge = (window as any).vkBridge
          }
          // Способ 3: из глобального объекта VK
          else if ((window as any).VK?.Bridge) {
            vkBridge = (window as any).VK.Bridge
          }
          
          console.log('[VKProvider] VK Bridge found:', !!vkBridge, 'bridge type:', vkBridge ? typeof vkBridge : 'none')
          
          // Если есть VK Bridge, используем его
          if (vkBridge && typeof vkBridge.send === 'function') {
            try {
              console.log('[VKProvider] Initializing VK Bridge...')
              await vkBridge.send('VKWebAppInit')
              console.log('[VKProvider] VK Bridge initialized')
              
              try {
                const userResult = await vkBridge.send('VKWebAppGetUserInfo')
                console.log('[VKProvider] User info from bridge:', userResult)
                if (userResult && userResult.id) {
                  detectedUser = userResult as UserInfo
                  setVkUser(userResult as UserInfo)
                }
              } catch (userError) {
                console.log('[VKProvider] Could not get user info via bridge, using URL params:', userError)
              }
            } catch (initError) {
              console.log('[VKProvider] VKWebAppInit error, using URL params:', initError)
            }
          }
          
          // Получаем данные из URL параметров (fallback или основной способ)
          const userId = urlParams.get('vk_user_id')
          if (userId && !detectedUser) {
            console.log('[VKProvider] Setting user from URL params, userId:', userId)
            detectedUser = {
              id: Number(userId),
              first_name: urlParams.get('vk_user_first_name') || 'Пользователь',
              last_name: urlParams.get('vk_user_last_name') || '',
              photo_200: urlParams.get('vk_user_photo_200') || undefined,
              photo_100: urlParams.get('vk_user_photo_100') || undefined,
              domain: urlParams.get('vk_user_domain') || undefined,
            } as UserInfo
            setVkUser(detectedUser)
          } else if (!userId) {
            console.log('[VKProvider] No vk_user_id in URL params')
          }
        } else {
          console.log('[VKProvider] Not in VK environment')
        }
      } catch (error) {
        console.error('[VKProvider] VK Mini App initialization error:', error)
      } finally {
        setIsReady(true)
        console.log('[VKProvider] Initialization complete, isVKMiniApp:', detectedVKMiniApp, 'vkUser:', detectedUser?.id || 'null')
      }
    }

    // Начинаем инициализацию сразу, без задержки
    initVK()
  }, [])

  const value: VKContextType = {
    vkUser,
    isVKMiniApp,
    isReady,
    initData,
  }

  return <VKContext.Provider value={value}>{children}</VKContext.Provider>
}
