'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useVK } from '@/components/providers/VKProvider'

/**
 * Хук для навигации в VK Mini App
 * Сохраняет параметры сессии при переходах между страницами
 */
export function useVKNavigation() {
  const router = useRouter()
  const { isVKMiniApp, sessionToken, vkUser } = useVK()

  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (!isVKMiniApp) {
      // Обычная навигация для не-VK окружения
      if (options?.replace) {
        router.replace(path)
      } else {
        router.push(path)
      }
      return
    }

    // Для VK Mini App добавляем параметры сессии в URL
    const url = new URL(path, window.location.origin)
    
    // Сохраняем VK параметры
    if (vkUser?.id) {
      url.searchParams.set('vk_user_id', String(vkUser.id))
      if (vkUser.first_name) url.searchParams.set('vk_user_first_name', vkUser.first_name)
      if (vkUser.last_name) url.searchParams.set('vk_user_last_name', vkUser.last_name)
    }

    // Используем router для SPA навигации (сохраняет состояние React)
    const fullPath = url.pathname + url.search
    
    console.log('[VKNavigation] Navigating to:', fullPath, 'isVKMiniApp:', isVKMiniApp)
    
    if (options?.replace) {
      router.replace(fullPath)
    } else {
      router.push(fullPath)
    }
  }, [isVKMiniApp, router, vkUser, sessionToken])

  return { navigate, isVKMiniApp }
}

