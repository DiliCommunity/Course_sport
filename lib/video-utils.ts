/**
 * Утилиты для работы с видео из Supabase Storage
 * 
 * Bucket: course_video (PUBLIC)
 * 
 * Структура:
 * course_video/
 * ├── keto/
 * │   ├── intro.mp4
 * │   ├── lesson_1.mp4
 * │   └── ...
 * ├── interval/
 * │   ├── intro.mp4
 * │   ├── lesson_1.mp4
 * │   └── ...
 * └── thumbnails/
 *     ├── keto_thumb.jpg
 *     └── interval_thumb.jpg
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const VIDEO_BUCKET = 'course_video'

/**
 * Получить публичный URL видео из Supabase Storage
 * @param courseSlug - Слаг курса (keto, interval)
 * @param lessonSlug - Слаг урока (intro, lesson_1, lesson_2...)
 * @returns URL видео
 */
export function getVideoUrl(courseSlug: string, lessonSlug: string): string {
  if (!SUPABASE_URL) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not set')
    return ''
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/${courseSlug}/${lessonSlug}.mp4`
}

/**
 * Получить URL превью видео (thumbnail)
 * @param courseSlug - Слаг курса
 * @returns URL превью
 */
export function getVideoThumbnail(courseSlug: string): string {
  if (!SUPABASE_URL) return ''
  
  return `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/thumbnails/${courseSlug}_thumb.jpg`
}

/**
 * Маппинг ID курса на слаг для видео
 */
export const courseVideoMapping: Record<string, string> = {
  '1': 'keto',        // Курс "Кето-диета"
  '2': 'interval',    // Курс "Интервальное голодание"
  'keto': 'keto',
  'interval': 'interval',
}

/**
 * Получить URL видео по ID курса и номеру урока
 */
export function getVideoUrlByCourseId(courseId: string, lessonNumber: number): string {
  const courseSlug = courseVideoMapping[courseId] || courseId
  const lessonSlug = lessonNumber === 0 ? 'intro' : `lesson_${lessonNumber}`
  
  return getVideoUrl(courseSlug, lessonSlug)
}

/**
 * Названия файлов видео для загрузки в Supabase Storage
 * 
 * Кето-диета (course_id: 1 или keto):
 * - keto/intro.mp4       - Вводное видео
 * - keto/lesson_1.mp4    - Урок 1: Что такое кето
 * - keto/lesson_2.mp4    - Урок 2: Расчет макросов
 * - keto/lesson_3.mp4    - Урок 3: Продукты
 * - keto/lesson_4.mp4    - Урок 4: Меню на неделю
 * - keto/lesson_5.mp4    - Урок 5: Адаптация
 * 
 * Интервальное голодание (course_id: 2 или interval):
 * - interval/intro.mp4       - Вводное видео
 * - interval/lesson_1.mp4    - Урок 1: Основы ИГ
 * - interval/lesson_2.mp4    - Урок 2: Схема 16/8
 * - interval/lesson_3.mp4    - Урок 3: Питание в окне
 * - interval/lesson_4.mp4    - Урок 4: Спорт и ИГ
 * - interval/lesson_5.mp4    - Урок 5: Продвинутые схемы
 */
export const VIDEO_FILES_GUIDE = {
  keto: [
    { file: 'keto/intro.mp4', title: 'Вводное видео' },
    { file: 'keto/lesson_1.mp4', title: 'Урок 1: Что такое кето' },
    { file: 'keto/lesson_2.mp4', title: 'Урок 2: Расчет макросов' },
    { file: 'keto/lesson_3.mp4', title: 'Урок 3: Разрешенные продукты' },
    { file: 'keto/lesson_4.mp4', title: 'Урок 4: Меню на неделю' },
    { file: 'keto/lesson_5.mp4', title: 'Урок 5: Кето-адаптация' },
  ],
  interval: [
    { file: 'interval/intro.mp4', title: 'Вводное видео' },
    { file: 'interval/lesson_1.mp4', title: 'Урок 1: Основы ИГ' },
    { file: 'interval/lesson_2.mp4', title: 'Урок 2: Схема 16/8' },
    { file: 'interval/lesson_3.mp4', title: 'Урок 3: Питание в окне' },
    { file: 'interval/lesson_4.mp4', title: 'Урок 4: Спорт и ИГ' },
    { file: 'interval/lesson_5.mp4', title: 'Урок 5: Продвинутые схемы' },
  ],
}

