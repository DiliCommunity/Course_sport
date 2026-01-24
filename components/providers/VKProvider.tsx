'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'
import bridge from '@vkontakte/vk-bridge'

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
  sessionToken: string | null
  saveSessionToken: (token: string) => Promise<void>
  clearSessionToken: () => Promise<void>
}

const VKContext = createContext<VKContextType>({
  vkUser: null,
  isVKMiniApp: false,
  isReady: false,
  initData: null,
  sessionToken: null,
  saveSessionToken: async () => {},
  clearSessionToken: async () => {},
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
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const bridgeInitializedRef = useRef(false)

  // Сохранение токена в VK Bridge Storage (работает в iOS VK Mini App!)
  // Токен сессии хранится в БД (sessions), это только клиентское хранилище для передачи токена
  const saveSessionToken = useCallback(async (token: string) => {
    console.log('[VKProvider] Saving session token to VK Bridge Storage...')
    setSessionToken(token)
    
    // VK Bridge Storage - единственный способ сохранить токен в VK Mini App на iOS
    if (bridge && typeof bridge.send === 'function') {
      try {
        await bridge.send('VKWebAppStorageSet', {
          key: 'session_token',
          value: token,
        })
        console.log('[VKProvider] ✅ Token saved to VK Bridge Storage')
      } catch (error) {
        console.error('[VKProvider] ❌ VK Bridge Storage save error:', error)
      }
    }
  }, [])

  // Очистка токена
  const clearSessionToken = useCallback(async () => {
    console.log('[VKProvider] Clearing session token...')
    setSessionToken(null)
    
    if (bridge && typeof bridge.send === 'function') {
      try {
        await bridge.send('VKWebAppStorageSet', {
          key: 'session_token',
          value: '',
        })
        console.log('[VKProvider] ✅ Token cleared from VK Bridge Storage')
      } catch (error) {
        console.error('[VKProvider] ❌ Could not clear VK Bridge Storage:', error)
      }
    }
  }, [])

  // Загрузка токена из VK Bridge Storage
  const loadSessionToken = useCallback(async (): Promise<string | null> => {
    if (bridge && typeof bridge.send === 'function') {
      try {
        const result = await bridge.send('VKWebAppStorageGet', {
          keys: ['session_token'],
        })
        if (result && result.keys && result.keys.length > 0) {
          const token = result.keys[0]?.value
          if (token) {
            console.log('[VKProvider] ✅ Token loaded from VK Bridge Storage')
            return token
          }
        }
      } catch (error) {
        console.log('[VKProvider] VK Bridge Storage read error:', error)
      }
    }
    return null
  }, [])

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
        // НО только если мы действительно в VK (hostname содержит vk.com или vk.ru)
        const isVKHostname = hostname.includes('vk.com') || hostname.includes('vk.ru')
        const storedVkUserId = (isVKHostname) ? (localStorage.getItem('vk_user_id') || sessionStorage.getItem('vk_user_id')) : null
        const storedVkApp = (isVKHostname) ? (localStorage.getItem('is_vk_mini_app') === 'true' || sessionStorage.getItem('is_vk_mini_app') === 'true') : false
        
        // НЕ используем cookie vk_id для определения VK Mini App
        // Cookie может быть установлен в обычном браузере после VK авторизации
        
        // Множественные способы определения VK окружения
        // VK Mini App определяется только по URL параметрам, hostname или VK Bridge
        const isVKEnv = 
          isVKHostname || // Основной признак - hostname содержит vk.com или vk.ru
          fullUrl.includes('vk.com') ||
          fullUrl.includes('vk.ru') ||
          referrer.includes('vk.com') ||
          referrer.includes('vk.ru') ||
          hasUserId || // Наличие vk_user_id в URL
          (isVKHostname && storedVkApp) || // Сохранённый флаг, но только если мы в VK
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
          storedVkUserId,
          storedVkApp,
          isVKHostname,
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
          
          // ВАЖНО: Всегда вызываем VKWebAppInit при загрузке приложения в VK Mini App
          // Это обязательное требование для прохождения модерации VK
          // Согласно документации: https://dev.vk.com/bridge/getting-started
          if (!bridgeInitializedRef.current) {
            try {
              console.log('[VKProvider] Initializing VK Bridge with @vkontakte/vk-bridge...')
              
              // Проверяем, что bridge доступен
              if (bridge && typeof bridge.send === 'function') {
                // Вызываем VKWebAppInit - это обязательный метод для инициализации приложения
                // Должен вызываться при каждой загрузке приложения в VK Mini App
                const initResult = await bridge.send('VKWebAppInit', {})
                console.log('[VKProvider] VKWebAppInit result:', initResult)
                bridgeInitializedRef.current = true
                
                // После успешной инициализации получаем информацию о пользователе
                try {
                  const userResult = await bridge.send('VKWebAppGetUserInfo', {})
                  console.log('[VKProvider] User info from bridge:', userResult)
                  if (userResult && (userResult as any).id) {
                    detectedUser = userResult as UserInfo
                    setVkUser(userResult as UserInfo)
                  }
                } catch (userError) {
                  console.log('[VKProvider] Could not get user info via bridge, using URL params:', userError)
                }
              } else {
                console.warn('[VKProvider] VK Bridge is not available, but we are in VK environment')
              }
            } catch (initError) {
              console.error('[VKProvider] VKWebAppInit error:', initError)
              // Даже если инициализация не удалась, продолжаем работу с URL параметрами
            }
          }
          
          // Получаем данные из URL параметров (fallback или основной способ)
          // Проверяем как search params, так и hash params, а также localStorage
          const userId = userIdFromSearch || userIdFromHash || urlParams.get('vk_user_id') || hashParams.get('vk_user_id') || storedVkUserId
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
        // Загружаем сохранённый токен сессии
        const savedToken = await loadSessionToken()
        if (savedToken) {
          setSessionToken(savedToken)
          console.log('[VKProvider] Loaded saved session token')
        }
        
        setIsReady(true)
        console.log('[VKProvider] Initialization complete, isVKMiniApp:', detectedVKMiniApp, 'vkUser:', detectedUser?.id || 'null', 'hasToken:', !!savedToken)
      }
    }

    // Начинаем инициализацию сразу, без задержки
    initVK()
    
    // Дополнительная проверка через 1 секунду - иногда данные приходят с задержкой
    // Также убеждаемся, что VKWebAppInit вызывается, если мы в VK Mini App
    const delayedCheck = setTimeout(async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const userIdFromUrl = urlParams.get('vk_user_id') || hashParams.get('vk_user_id')
      const userIdFromStorage = localStorage.getItem('vk_user_id') || sessionStorage.getItem('vk_user_id')
      const userId = userIdFromUrl || userIdFromStorage
      
      // Проверяем hostname, чтобы убедиться, что мы действительно в VK
      const isVKHost = window.location.hostname.includes('vk.com') || window.location.hostname.includes('vk.ru')
      
      // Если мы в VK (по hostname) и еще не инициализировали bridge - делаем это
      // Это гарантирует, что VKWebAppInit будет вызван даже если основная проверка не сработала
      if (isVKHost && bridge && typeof bridge.send === 'function') {
        try {
          // Если bridge еще не инициализирован - инициализируем
          if (!bridgeInitializedRef.current) {
            // ВАЖНО: VKWebAppInit должен вызываться при каждой загрузке приложения в VK Mini App
            // Это обязательное требование для прохождения модерации
            await bridge.send('VKWebAppInit', {})
            bridgeInitializedRef.current = true
            console.log('[VKProvider] Delayed check: VKWebAppInit called successfully')
          }
          
          // Пытаемся получить данные пользователя через VK Bridge, если еще не получили
          if (!vkUser && bridgeInitializedRef.current) {
            try {
              const userResult = await bridge.send('VKWebAppGetUserInfo', {})
              console.log('[VKProvider] Delayed check: User info from bridge:', userResult)
              if (userResult && (userResult as any).id) {
                setVkUser(userResult as UserInfo)
                console.log('[VKProvider] Delayed check: User set from VK Bridge')
              }
            } catch (userError) {
              console.log('[VKProvider] Delayed check: Could not get user info via bridge:', userError)
            }
          }
        } catch (error) {
          console.log('[VKProvider] Delayed check: VKWebAppInit error (may be already initialized):', error)
        }
      }
      
      // Если нашли vk_user_id из URL или storage - это VK Mini App
      if (userId && !isVKMiniApp && (isVKHost || userIdFromUrl)) {
        console.log('[VKProvider] Delayed check: Found vk_user_id, setting isVKMiniApp to true')
        setIsVKMiniApp(true)
        
        if (!vkUser) {
          const detectedUser: UserInfo = {
            id: Number(userId),
            first_name: urlParams.get('vk_user_first_name') || hashParams.get('vk_user_first_name') || localStorage.getItem('vk_user_first_name') || 'Пользователь',
            last_name: urlParams.get('vk_user_last_name') || hashParams.get('vk_user_last_name') || localStorage.getItem('vk_user_last_name') || '',
            photo_200: urlParams.get('vk_user_photo_200') || hashParams.get('vk_user_photo_200') || localStorage.getItem('vk_user_photo_200') || undefined,
            photo_100: urlParams.get('vk_user_photo_100') || hashParams.get('vk_user_photo_100') || localStorage.getItem('vk_user_photo_100') || undefined,
            domain: urlParams.get('vk_user_domain') || hashParams.get('vk_user_domain') || localStorage.getItem('vk_user_domain') || undefined,
          }
          setVkUser(detectedUser)
          // Сохраняем в localStorage для будущего использования
          localStorage.setItem('vk_user_id', String(detectedUser.id))
          if (detectedUser.first_name) localStorage.setItem('vk_user_first_name', detectedUser.first_name)
          if (detectedUser.last_name) localStorage.setItem('vk_user_last_name', detectedUser.last_name)
          if (detectedUser.photo_200) localStorage.setItem('vk_user_photo_200', detectedUser.photo_200)
          if (detectedUser.photo_100) localStorage.setItem('vk_user_photo_100', detectedUser.photo_100)
          if (detectedUser.domain) localStorage.setItem('vk_user_domain', detectedUser.domain)
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
    sessionToken,
    saveSessionToken,
    clearSessionToken,
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
