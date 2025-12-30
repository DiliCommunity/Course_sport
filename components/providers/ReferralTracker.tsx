'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Компонент для отслеживания реферальных ссылок
 * Сохраняет реферальный код из URL в sessionStorage при переходе на любую страницу
 * 
 * Добавить в layout.tsx:
 * import { ReferralTracker } from '@/components/providers/ReferralTracker'
 * <ReferralTracker />
 */
export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Получаем реферальный код из URL параметров
    const referralCode = searchParams.get('ref')
    
    if (referralCode) {
      // Сохраняем в sessionStorage (не localStorage - чтобы не сохранялся между сессиями)
      sessionStorage.setItem('pending_referral', referralCode)
      console.log('✅ Реферальный код сохранён:', referralCode)
      
      // Также сохраним время для отслеживания (опционально)
      sessionStorage.setItem('referral_timestamp', new Date().toISOString())
    }
  }, [searchParams])

  // Компонент не рендерит ничего
  return null
}

/**
 * Хук для получения сохраненного реферального кода
 */
export function usePendingReferral(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('pending_referral')
}

/**
 * Функция для очистки реферального кода после использования
 */
export function clearPendingReferral() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pending_referral')
    sessionStorage.removeItem('referral_timestamp')
  }
}

