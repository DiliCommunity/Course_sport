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
  refreshSession: () => Promise<void>
}

const VKContext = createContext<VKContextType>({
  vkUser: null,
  isVKMiniApp: false,
  isReady: false,
  initData: null,
  sessionToken: null,
  saveSessionToken: async () => {},
  clearSessionToken: async () => {},
  refreshSession: async () => {},
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

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        promise,
        new Promise<T>((resolve) => {
          timeoutId = setTimeout(() => resolve(fallback), ms)
        }),
      ])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Сохранение токена в VK Bridge Storage (работает в iOS VK Mini App!)
  // Токен сессии хранится в БД (sessions), это только клиентское хранилище для передачи токена
  const saveSessionToken = useCallback(async (token: string) => {
    console.log('[VKProvider] Saving session token...')
    setSessionToken(token)
    
    // Сохраняем в sessionStorage для быстрого доступа при SPA навигации
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vk_session_token', token)
      console.log('[VKProvider] ✅ Token saved to sessionStorage')
    }
    
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
    
    // Очищаем sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vk_session_token')
    }
    
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
    // Сначала проверяем sessionStorage (быстрее и надёжнее для SPA навигации)
    if (typeof window !== 'undefined') {
      const cachedToken = sessionStorage.getItem('vk_session_token')
      if (cachedToken) {
        console.log('[VKProvider] ✅ Token loaded from sessionStorage (fast path)')
        return cachedToken
      }
    }
    
    // Затем пробуем VK Bridge Storage
    if (bridge && typeof bridge.send === 'function') {
      try {
        const result = await bridge.send('VKWebAppStorageGet', {
          keys: ['session_token'],
        })
        if (result && result.keys && result.keys.length > 0) {
          const token = result.keys[0]?.value
          if (token) {
            console.log('[VKProvider] ✅ Token loaded from VK Bridge Storage')
            // Кэшируем в sessionStorage для быстрого доступа
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('vk_session_token', token)
            }
            return token
          }
        }
      } catch (error) {
        console.log('[VKProvider] VK Bridge Storage read error:', error)
      }
    }
    return null
  }, [])

  // Обновление сессии - вызывается при навигации для перезагрузки токена
  const refreshSession = useCallback(async () => {
    if (!isVKMiniApp) return
    
    console.log('[VKProvider] Refreshing session...')
    const token = await loadSessionToken()
    if (token && token !== sessionToken) {
      setSessionToken(token)
      console.log('[VKProvider] Session refreshed with token')
    }
  }, [isVKMiniApp, loadSessionToken, sessionToken])

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
        
        // Проверяем hostname и флаг в sessionStorage (для сохранения состояния при SPA навигации)
        const isVKHostname = hostname.includes('vk.com') || hostname.includes('vk.ru')
        const wasVKMiniApp = typeof window !== 'undefined' && sessionStorage.getItem('is_vk_mini_app') === 'true'
        
        // НЕ используем cookie vk_id для определения VK Mini App
        // Cookie может быть установлен в обычном браузере после VK авторизации
        
        // Множественные способы определения VK окружения
        // VK Mini App определяется по:
        // 1. Hostname содержит vk.com или vk.ru
        // 2. Есть VK параметры в URL (vk_user_id, vk_platform и т.д.)
        // 3. Есть VK Bridge в window
        // 4. Был определён как VK Mini App ранее (sessionStorage)
        const isVKEnv = 
          wasVKMiniApp || // Сохранённый флаг (для SPA навигации)
          isVKHostname || // Основной признак - hostname содержит vk.com или vk.ru
          hasUserId || // Наличие vk_user_id в URL
          urlParams.has('vk_access_token_settings') ||
          urlParams.has('vk_platform') ||
          urlParams.has('vk_is_app_user') ||
          hashParams.has('vk_user_id') ||
          ((window as any).vkBridge && isVKHostname) || // VK Bridge только если hostname тоже VK
          ((window as any).bridge && isVKHostname) // Альтернативный способ доступа к bridge
        
        console.log('[VKProvider] VK environment check:', {
          hostname,
          fullUrl: fullUrl.substring(0, 100),
          hasVkUserId: hasUserId,
          userIdFromSearch,
          userIdFromHash,
          isVKHostname,
          hasVkAccessToken: urlParams.has('vk_access_token_settings'),
          hasVkPlatform: urlParams.has('vk_platform'),
          hasVkIsAppUser: urlParams.has('vk_is_app_user'),
          hasBridge: !!(window as any).vkBridge || !!(window as any).bridge,
          isVKEnv
        })
        
        if (isVKEnv) {
          detectedVKMiniApp = true
          setIsVKMiniApp(true)
          setInitData(window.location.search)
          
          // Сохраняем флаг в sessionStorage для сохранения состояния при SPA навигации
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('is_vk_mini_app', 'true')
          }
          
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
                    // Сохраняем в sessionStorage
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('vk_user', JSON.stringify(userResult))
                    }
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
          
          // Получаем данные из URL параметров или sessionStorage (для SPA навигации)
          const userId = userIdFromSearch || userIdFromHash || urlParams.get('vk_user_id') || hashParams.get('vk_user_id')
          
          // Пробуем загрузить сохранённого пользователя из sessionStorage
          let cachedUser: UserInfo | null = null
          if (typeof window !== 'undefined') {
            const cachedUserStr = sessionStorage.getItem('vk_user')
            if (cachedUserStr) {
              try {
                cachedUser = JSON.parse(cachedUserStr)
                console.log('[VKProvider] Loaded cached VK user from sessionStorage:', cachedUser?.id)
              } catch (e) {
                console.log('[VKProvider] Failed to parse cached VK user')
              }
            }
          }
          
          if (userId && !detectedUser) {
            console.log('[VKProvider] Setting user from URL params, userId:', userId)
            // Используем параметры из того источника, где нашли userId
            const sourceParams = userIdFromSearch || urlParams.get('vk_user_id') ? urlParams : hashParams
            detectedUser = {
              id: Number(userId),
              first_name: sourceParams.get('vk_user_first_name') || urlParams.get('vk_user_first_name') || hashParams.get('vk_user_first_name') || 'Пользователь',
              last_name: sourceParams.get('vk_user_last_name') || urlParams.get('vk_user_last_name') || hashParams.get('vk_user_last_name') || '',
              photo_200: sourceParams.get('vk_user_photo_200') || urlParams.get('vk_user_photo_200') || hashParams.get('vk_user_photo_200') || undefined,
              photo_100: sourceParams.get('vk_user_photo_100') || urlParams.get('vk_user_photo_100') || hashParams.get('vk_user_photo_100') || undefined,
              domain: sourceParams.get('vk_user_domain') || urlParams.get('vk_user_domain') || hashParams.get('vk_user_domain') || undefined,
            } as UserInfo
            setVkUser(detectedUser)
            
            // Сохраняем пользователя в sessionStorage
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('vk_user', JSON.stringify(detectedUser))
            }
            
            // Если нашли пользователя через URL - это точно VK Mini App
            if (!detectedVKMiniApp) {
              detectedVKMiniApp = true
              setIsVKMiniApp(true)
              sessionStorage.setItem('is_vk_mini_app', 'true')
            }
          } else if (cachedUser && !detectedUser) {
            // Используем кэшированного пользователя
            console.log('[VKProvider] Using cached VK user:', cachedUser.id)
            detectedUser = cachedUser
            setVkUser(cachedUser)
          } else if (!userId && !cachedUser) {
            console.log('[VKProvider] No vk_user_id in URL params or cache')
          }
        } else {
          console.log('[VKProvider] Not in VK environment')
        }
      } catch (error) {
        console.error('[VKProvider] VK Mini App initialization error:', error)
      } finally {
        // Загружаем сохранённый токен сессии ТОЛЬКО в VK Mini App.
        // В других окружениях VK Bridge Storage может зависать -> блокирует isReady и ломает /login.
        let savedToken: string | null = null
        if (detectedVKMiniApp) {
          savedToken = await withTimeout(loadSessionToken(), 800, null)
          if (savedToken) {
            setSessionToken(savedToken)
            console.log('[VKProvider] Loaded saved session token')
          }
        }

        setIsReady(true)
        console.log('[VKProvider] Initialization complete, isVKMiniApp:', detectedVKMiniApp, 'vkUser:', detectedUser?.id || 'null', 'hasToken:', !!savedToken)
      }
    }

    // Начинаем инициализацию сразу, без задержки
    initVK()
    
    // Дополнительная проверка через 1 секунду - иногда VK Bridge инициализируется с задержкой
    const delayedCheck = setTimeout(async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const userIdFromUrl = urlParams.get('vk_user_id') || hashParams.get('vk_user_id')
      
      // Проверяем hostname, чтобы убедиться, что мы действительно в VK
      const isVKHost = window.location.hostname.includes('vk.com') || window.location.hostname.includes('vk.ru')
      
      // Если мы в VK (по hostname) и еще не инициализировали bridge - делаем это
      if (isVKHost && bridge && typeof bridge.send === 'function') {
        try {
          if (!bridgeInitializedRef.current) {
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
      
      // Если нашли vk_user_id ТОЛЬКО из URL - это VK Mini App
      if (userIdFromUrl && !isVKMiniApp && isVKHost) {
        console.log('[VKProvider] Delayed check: Found vk_user_id in URL, setting isVKMiniApp to true')
        setIsVKMiniApp(true)
        
        if (!vkUser) {
          const detectedUser: UserInfo = {
            id: Number(userIdFromUrl),
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
    sessionToken,
    saveSessionToken,
    clearSessionToken,
    refreshSession,
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
