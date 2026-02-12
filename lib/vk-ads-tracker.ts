/**
 * Утилита для отслеживания событий VK Ads (Top.Mail.Ru)
 * Используется для отслеживания конверсий: регистраций, покупок и т.д.
 */

declare global {
  interface Window {
    _tmr?: Array<any>
  }
}

/**
 * Отправляет событие в VK Ads пиксель
 */
export function trackVKEvent(eventType: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined') return

  // Проверяем, что пиксель загружен
  if (!window._tmr) {
    console.warn('VK Ads pixel not loaded yet')
    return
  }

  // Отправляем событие
  window._tmr.push({
    id: '3742277',
    type: eventType,
    ...eventParams
  })

  console.log('VK Ads event tracked:', eventType, eventParams)
}

/**
 * Отслеживание регистрации пользователя
 * Событие автоматически появится в VK Ads после первого вызова
 */
export function trackRegistration(userId?: string) {
  if (typeof window === 'undefined' || !window._tmr) return
  
  // Отправляем событие - VK Ads автоматически зарегистрирует его при первом вызове
  window._tmr.push({
    id: '3742277',
    type: 'reachGoal',
    goal: 'registration' // Название события - появится в VK Ads автоматически
  })
  
  console.log('VK Ads: Registration event tracked')
}

/**
 * Отслеживание покупки курса
 * Событие автоматически появится в VK Ads после первого вызова
 */
export function trackPurchase(courseId: string, courseTitle: string, price: number, currency: string = 'RUB') {
  if (typeof window === 'undefined' || !window._tmr) return
  
  // Отправляем событие покупки с параметрами
  window._tmr.push({
    id: '3742277',
    type: 'reachGoal',
    goal: 'purchase', // Название события - появится в VK Ads автоматически
    // Параметры для e-commerce (могут использоваться для аналитики)
    price: price,
    currency: currency,
    order_id: courseId
  })
  
  console.log('VK Ads: Purchase event tracked', { courseId, price, currency })
}

/**
 * Отслеживание просмотра страницы курса
 */
export function trackCourseView(courseId: string, courseTitle: string) {
  trackVKEvent('reachGoal', {
    goal: 'course_view',
    course_id: courseId,
    course_title: courseTitle
  })
}

/**
 * Отслеживание добавления в корзину (если будет)
 */
export function trackAddToCart(courseId: string, courseTitle: string, price: number) {
  trackVKEvent('reachGoal', {
    goal: 'add_to_cart',
    course_id: courseId,
    course_title: courseTitle,
    price: price
  })
}

