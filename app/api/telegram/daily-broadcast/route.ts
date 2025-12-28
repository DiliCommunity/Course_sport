import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Максимум 60 секунд для Vercel

// Контент для ежедневной рассылки - бесплатные уроки и советы
const dailyContent = [
  // Понедельник - Кето основы
  {
    day: 1,
    type: 'lesson',
    title: '🥑 Урок 1: Введение в кето-диету',
    text: `🔥 <b>Бесплатный урок: Введение в кето-диету</b>

Кето-диета — это не просто диета, а образ жизни, который перезагружает ваш метаболизм!

<b>Что вы узнаете:</b>
• Что такое кетоз и как он работает
• Почему жир становится топливом
• Первые шаги к кето-образу жизни

💡 <b>Факт дня:</b> На кето организм сжигает до 300% больше жира, чем на обычном питании!

🎁 Этот урок доступен бесплатно в нашем приложении!`,
    image: '/img/keto_course.png',
    courseId: '1'
  },
  // Вторник - Интервальное голодание
  {
    day: 2,
    type: 'lesson',
    title: '⏰ Урок 1: Что такое интервальное голодание?',
    text: `🌟 <b>Бесплатный урок: Интервальное голодание</b>

Что если главный секрет здоровья лежит не в том, ЧТО есть, а в том, КОГДА есть?

<b>Популярные схемы ИГ:</b>
• 16/8 — 16 часов голода, 8 часов еды
• 18/6 — более интенсивный вариант
• 20/4 — для продвинутых

💡 <b>Факт дня:</b> При голодании запускается автофагия — процесс "самоочищения" клеток!

🎁 Смотрите бесплатно в приложении!`,
    image: '/img/interval_course.png',
    courseId: '2'
  },
  // Среда - Рецепт
  {
    day: 3,
    type: 'recipe',
    title: '🍳 Кето-рецепт: Омлет с авокадо',
    text: `🥑 <b>Рецепт дня: Омлет с авокадо и сыром</b>

Идеальный кето-завтрак за 15 минут!

<b>Ингредиенты:</b>
• 3 яйца
• 1/2 авокадо
• 50г сыра чеддер
• Масло, соль, перец

<b>КБЖУ на порцию:</b>
🔥 450 ккал | Б: 25г | Ж: 38г | У: 4г

💡 Авокадо — суперфуд кето! Содержит полезные жиры и клетчатку.

📥 Скачайте полный рецепт в приложении!`,
    image: '/img/recipes/avocado-cheese-omlet.jpg',
    courseId: '1'
  },
  // Четверг - Наука кетоза
  {
    day: 4,
    type: 'lesson',
    title: '🧬 Урок 2: Наука кетоза',
    text: `🔬 <b>Бесплатный урок: Как работает кетоз</b>

Когда вы ограничиваете углеводы, происходит магия!

<b>Что происходит в организме:</b>
• Печень начинает производить кетоны
• Мозг получает альтернативное топливо
• Жировые запасы становятся основным источником энергии

💡 <b>Факт дня:</b> Кетоны — более эффективное топливо для мозга, чем глюкоза!

🎁 Полный урок доступен бесплатно!`,
    image: '/img/keto_course.png',
    courseId: '1'
  },
  // Пятница - Совет по ИГ
  {
    day: 5,
    type: 'tip',
    title: '💧 Что пить во время голодания?',
    text: `☕ <b>Совет дня: Напитки во время голодания</b>

Во время окна голодания можно пить:

✅ <b>Разрешено:</b>
• Вода (обычная и минеральная)
• Чёрный кофе без сахара
• Зелёный чай
• Травяные чаи

❌ <b>Нельзя:</b>
• Соки и смузи
• Молоко и сливки
• Сладкие напитки

💡 <b>Лайфхак:</b> Добавьте щепотку соли в воду для поддержания электролитов!

📚 Больше советов в курсе!`,
    image: '/img/interval_course.png',
    courseId: '2'
  },
  // Суббота - Рецепт
  {
    day: 6,
    type: 'recipe',
    title: '🥗 Кето-рецепт: Салат Цезарь',
    text: `🥬 <b>Рецепт дня: Кето Цезарь с курицей</b>

Классика в кето-версии!

<b>Ингредиенты:</b>
• 200г куриной грудки
• Романо или айсберг
• 50г пармезана
• 50г бекона
• Заправка Цезарь

<b>КБЖУ на порцию:</b>
🔥 550 ккал | Б: 42г | Ж: 40г | У: 5г

💡 Используйте домашнюю заправку без сахара для идеального кето-блюда!

📥 Все рецепты в приложении!`,
    image: '/img/recipes/keto-caesar-salad.jpg',
    courseId: '1'
  },
  // Воскресенье - Мотивация
  {
    day: 0,
    type: 'motivation',
    title: '🏆 Воскресная мотивация',
    text: `💪 <b>Начните новую неделю правильно!</b>

Каждый день — это шанс стать лучше!

<b>Результаты наших студентов:</b>
📊 Средняя потеря веса: 5-10 кг за месяц
⚡ 87% отмечают прилив энергии
😴 Улучшение качества сна
🧠 Повышение концентрации

<i>"Кето изменило мою жизнь! За 3 месяца минус 15 кг и куча энергии!"</i>
— Елена, 34 года

🎯 Ваша цель достижима! Начните сегодня!

🚀 Откройте приложение и начните свой путь!`,
    image: '/img/keto_course.png',
    courseId: '1'
  },
]

// Отправка сообщения в Telegram
async function sendTelegramMessage(
  chatId: number,
  text: string,
  photoUrl: string,
  buttons: { text: string; url?: string; web_app?: { url: string } }[][]
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return { success: false, error: 'Bot token not configured' }
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://course-sport.vercel.app'
  const fullPhotoUrl = photoUrl.startsWith('http') ? photoUrl : `${appUrl}${photoUrl}`

  const replyMarkup = {
    inline_keyboard: buttons
  }

  try {
    // Пробуем отправить с фото
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: fullPhotoUrl,
        caption: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    })

    if (!response.ok) {
      // Если фото не отправилось, отправляем текст
      const textResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      })
      
      if (!textResponse.ok) {
        const error = await textResponse.json()
        return { success: false, error: error.description }
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// GET запрос для cron job
export async function GET(request: NextRequest) {
  // Проверяем секретный ключ для cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://course-sport.vercel.app'

    // Получаем день недели (0 = воскресенье, 1 = понедельник, ...)
    const today = new Date()
    const dayOfWeek = today.getDay()

    // Выбираем контент на сегодня
    const todayContent = dailyContent.find(c => c.day === dayOfWeek) || dailyContent[0]

    // Получаем всех активных подписчиков
    const { data: subscribers, error: subError } = await supabase
      .from('telegram_subscribers')
      .select('chat_id, first_name')
      .eq('is_active', true)

    if (subError) {
      console.error('Error fetching subscribers:', subError)
      // Если таблица не существует, пробуем получить из users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('telegram_id, name')
        .not('telegram_id', 'is', null)

      if (usersError || !users?.length) {
        return NextResponse.json({ 
          error: 'No subscribers found',
          details: subError?.message || usersError?.message 
        }, { status: 404 })
      }

      // Используем telegram_id как chat_id
      const userSubscribers = users.map(u => ({
        chat_id: parseInt(u.telegram_id!),
        first_name: u.name
      }))

      return await broadcastToSubscribers(userSubscribers, todayContent, appUrl, supabase)
    }

    if (!subscribers?.length) {
      return NextResponse.json({ message: 'No active subscribers' })
    }

    return await broadcastToSubscribers(subscribers, todayContent, appUrl, supabase)
  } catch (error: any) {
    console.error('Daily broadcast error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function broadcastToSubscribers(
  subscribers: { chat_id: number; first_name?: string }[],
  content: typeof dailyContent[0],
  appUrl: string,
  supabase: any
) {
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  // Кнопки для сообщения
  const buttons = [
    [
      {
        text: '🚀 Открыть приложение',
        web_app: { url: appUrl }
      }
    ],
    [
      {
        text: '📚 Смотреть курсы',
        url: `${appUrl}/courses`
      },
      {
        text: '🥗 Рецепты',
        url: `${appUrl}/keto-food`
      }
    ]
  ]

  // Отправляем сообщения с задержкой (чтобы не превысить лимиты Telegram)
  for (const subscriber of subscribers) {
    // Персонализируем сообщение
    const personalizedText = subscriber.first_name 
      ? `👋 ${subscriber.first_name}!\n\n${content.text}`
      : content.text

    const result = await sendTelegramMessage(
      subscriber.chat_id,
      personalizedText,
      content.image,
      buttons
    )

    if (result.success) {
      successCount++
    } else {
      errorCount++
      errors.push(`Chat ${subscriber.chat_id}: ${result.error}`)
      
      // Если пользователь заблокировал бота, деактивируем его
      if (result.error?.includes('blocked') || result.error?.includes('deactivated')) {
        await supabase
          .from('telegram_subscribers')
          .update({ is_active: false })
          .eq('chat_id', subscriber.chat_id)
      }
    }

    // Задержка между сообщениями (30 сообщений в секунду - лимит Telegram)
    await new Promise(resolve => setTimeout(resolve, 35))
  }

  // Сохраняем статистику рассылки
  try {
    await supabase.from('telegram_broadcasts').insert({
      content_type: content.type,
      content_id: content.courseId,
      message_text: content.text,
      image_url: content.image,
      recipients_count: subscribers.length,
      success_count: successCount,
      error_count: errorCount
    })
  } catch (e) {
    console.error('Failed to save broadcast stats:', e)
  }

  return NextResponse.json({
    success: true,
    message: `Daily broadcast completed`,
    stats: {
      total: subscribers.length,
      success: successCount,
      errors: errorCount,
      contentType: content.type,
      title: content.title
    },
    errorDetails: errors.slice(0, 5) // Первые 5 ошибок для отладки
  })
}

// POST для ручного запуска рассылки (для тестирования)
export async function POST(request: NextRequest) {
  // Только для админов - проверяем секретный ключ
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Вызываем GET для отправки рассылки
  return GET(request)
}

