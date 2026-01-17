/**
 * Константы для идентификаторов курсов
 * UUID совпадают с записями в таблице courses в Supabase
 */

export const COURSE_IDS = {
  KETO: '00000000-0000-0000-0000-000000000001',
  INTERVAL: '00000000-0000-0000-0000-000000000002',
} as const

// Маппинг для обратной совместимости (старые ID → новые UUID)
export const COURSE_ID_MAP: Record<string, string> = {
  '1': COURSE_IDS.KETO,
  '2': COURSE_IDS.INTERVAL,
  [COURSE_IDS.KETO]: COURSE_IDS.KETO,
  [COURSE_IDS.INTERVAL]: COURSE_IDS.INTERVAL,
}

// Функция для получения правильного UUID
export function getCourseUUID(id: string): string {
  return COURSE_ID_MAP[id] || id
}

// Цены курсов (в копейках)
// ВАЖНО: Минимальная сумма для ЮКассы - 1₽ (100 копеек)
export const COURSE_PRICES = {
  [COURSE_IDS.KETO]: 169900, // 1699₽
  [COURSE_IDS.INTERVAL]: 169900, // 1699₽
} as const

// Оригинальные цены (в копейках)
export const COURSE_ORIGINAL_PRICES = {
  [COURSE_IDS.KETO]: 499900, // 4999₽
  [COURSE_IDS.INTERVAL]: 499900,
} as const

