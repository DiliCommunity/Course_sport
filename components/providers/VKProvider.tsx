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
        const hashParams = new URLSearchParams(window.location.hash.substring(1)) // Параметры могут быть в hash
        const fullUrl = window.location.href
        const hostname = window.location.hostname
        const referrer = document.referrer
        
        // Проверяем все возможные источники vk_user_id
        const userIdFromSearch = urlParams.get('vk_user_id')
        const userIdFromHash = hashParams.get('vk_user_id')
        const hasUserId = !!(userIdFromSearch || userIdFromHash)
        
        // Проверяем localStorage/sessionStorage для сохранённых VK данных
        const storedVkUserId = localStorage.getItem('vk_user_id') || sessionStorage.getItem('vk_user_id')
        const storedVkApp = localStorage.getItem('is_vk_mini_app') === 'true' || sessionStorage.getItem('is_vk_mini_app') === 'true'
        
        // Проверяем cookie vk_id (устанавливается при VK авторизации)
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return null
        }
        const vkIdFromCookie = getCookie('vk_id')
        
        // Множественные способы определения VK окружения
        const isVKEnv = 
          hostname.includes('vk.com') || 
          hostname.includes('vk.ru') ||
          fullUrl.includes('vk.com') ||
          fullUrl.includes('vk.ru') ||
          referrer.includes('vk.com') ||
          referrer.includes('vk.ru') ||
          hasUserId || // Основной признак - наличие vk_user_id
          !!storedVkUserId || // Проверяем сохранённые данные
          !!vkIdFromCookie || // Проверяем cookie vk_id (устанавливается при VK авторизации)
          storedVkApp || // Проверяем сохранённый флаг
          urlParams.has('vk_access_token_settings') ||
          urlParams.has('vk_platform') ||
          urlParams.has('vk_is_app_user') ||
          hashParams.has('vk_user_id') ||
          (window as any).vkBridge || // Проверяем наличие VK Bridge в window
          (window as any).bridge // Альтернативный способ доступа к bridge
        
        console.log('[VKProvider] VK environment check:', {
          hostname,
          fullUrl: fullUrl.substring(0, 100), // Логируем только первые 100 символов
          hasVkUserId: hasUserId,
          userIdFromSearch,
          userIdFromHash,
          vkIdFromCookie,
          storedVkUserId,
          storedVkApp,
          hasVkAccessToken: urlParams.has('vk_access_token_settings'),
          hasVkPlatform: urlParams.has('vk_platform'),
          hasVkIsAppUser: urlParams.has('vk_is_app_user'),
          referrer: referrer.substring(0, 100),
          hasBridge: !!(window as any).vkBridge || !!(window as any).bridge,
          isVKEnv
        })
        
        if (isVKEnv) {
          detectedVKMiniApp = true
          setIsVKMiniApp(true)
          setInitData(window.location.search)
          
          // Сохраняем флаг VK Mini App в localStorage для использования после редиректов
          localStorage.setItem('is_vk_mini_app', 'true')
          
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
          // Проверяем как search params, так и hash params, а также cookie и localStorage
          const userId = userIdFromSearch || userIdFromHash || urlParams.get('vk_user_id') || hashParams.get('vk_user_id') || storedVkUserId || vkIdFromCookie
          if (userId && !detectedUser) {
            console.log('[VKProvider] Setting user from URL params/storage, userId:', userId)
            // Используем параметры из того источника, где нашли userId
            const sourceParams = userIdFromSearch || urlParams.get('vk_user_id') ? urlParams : hashParams
            detectedUser = {
              id: Number(userId),
              first_name: sourceParams.get('vk_user_first_name') || urlParams.get('vk_user_first_name') || hashParams.get('vk_user_first_name') || localStorage.getItem('vk_user_first_name') || 'Пользователь',
              last_name: sourceParams.get('vk_user_last_name') || urlParams.get('vk_user_last_name') || hashParams.get('vk_user_last_name') || localStorage.getItem('vk_user_last_name') || '',
              photo_200: sourceParams.get('vk_user_photo_200') || urlParams.get('vk_user_photo_200') || hashParams.get('vk_user_photo_200') || localStorage.getItem('vk_user_photo_200') || undefined,
              photo_100: sourceParams.get('vk_user_photo_100') || urlParams.get('vk_user_photo_100') || hashParams.get('vk_user_photo_100') || localStorage.getItem('vk_user_photo_100') || undefined,
              domain: sourceParams.get('vk_user_domain') || urlParams.get('vk_user_domain') || hashParams.get('vk_user_domain') || localStorage.getItem('vk_user_domain') || undefined,
            } as UserInfo
            setVkUser(detectedUser)
            
            // Сохраняем данные пользователя в localStorage
            localStorage.setItem('vk_user_id', String(detectedUser.id))
            if (detectedUser.first_name) localStorage.setItem('vk_user_first_name', detectedUser.first_name)
            if (detectedUser.last_name) localStorage.setItem('vk_user_last_name', detectedUser.last_name)
            if (detectedUser.photo_200) localStorage.setItem('vk_user_photo_200', detectedUser.photo_200)
            if (detectedUser.photo_100) localStorage.setItem('vk_user_photo_100', detectedUser.photo_100)
            if (detectedUser.domain) localStorage.setItem('vk_user_domain', detectedUser.domain)
            
            // Если нашли пользователя через URL - это точно VK Mini App
            if (!detectedVKMiniApp) {
              detectedVKMiniApp = true
              setIsVKMiniApp(true)
              localStorage.setItem('is_vk_mini_app', 'true')
            }
          } else if (!userId) {
            console.log('[VKProvider] No vk_user_id in URL params, hash, or storage')
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
    
    // Дополнительная проверка через 1 секунду - иногда данные приходят с задержкой
    const delayedCheck = setTimeout(() => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
      }
      
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const userIdFromUrl = urlParams.get('vk_user_id') || hashParams.get('vk_user_id')
      const userIdFromStorage = localStorage.getItem('vk_user_id') || sessionStorage.getItem('vk_user_id')
      const userIdFromCookie = getCookie('vk_id')
      const userId = userIdFromUrl || userIdFromStorage || userIdFromCookie
      
      // Если нашли vk_user_id из любого источника - это VK Mini App
      if (userId && !isVKMiniApp) {
        console.log('[VKProvider] Delayed check: Found vk_user_id, setting isVKMiniApp to true')
        setIsVKMiniApp(true)
        
        if (!vkUser) {
          const detectedUser: UserInfo = {
            id: Number(userId),
            first_name: urlParams.get('vk_user_first_name') || hashParams.get('vk_user_first_name') || 'Пользователь',
            last_name: urlParams.get('vk_user_last_name') || hashParams.get('vk_user_last_name') || '',
            photo_200: urlParams.get('vk_user_photo_200') || hashParams.get('vk_user_photo_200') || undefined,
            photo_100: urlParams.get('vk_user_photo_100') || hashParams.get('vk_user_photo_100') || undefined,
            domain: urlParams.get('vk_user_domain') || hashParams.get('vk_user_domain') || undefined,
          }
          setVkUser(detectedUser)
        }
      }
    }, 1000)
    
    return () => clearTimeout(delayedCheck)
  }, [])

  const value: VKContextType = {
    vkUser,
    isVKMiniApp,
    isReady,
    initData,
  }

  // Логируем финальное значение для отладки
  useEffect(() => {
    if (isReady) {
      console.log('[VKProvider] Context value updated:', {
        isVKMiniApp,
        vkUser: vkUser?.id || null,
        isReady
      })
    }
  }, [isReady, isVKMiniApp, vkUser])

  return <VKContext.Provider value={value}>{children}</VKContext.Provider>
}
