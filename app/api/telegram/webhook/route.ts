import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
    photo?: Array<{
      file_id: string
      file_unique_id: string
      width: number
      height: number
      file_size?: number
    }>
  }
  callback_query?: {
    id: string
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    message?: {
      message_id: number
      chat: {
        id: number
        type: string
      }
    }
    data?: string
  }
}

// Отправка сообщения через Telegram Bot API
async function sendTelegramMessage(
  chatId: number,
  text: string,
  photoUrl?: string,
  replyMarkup?: any
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return null
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}`

  try {
    // Если есть фото, отправляем фото с подписью
    if (photoUrl) {
      const response = await fetch(`${telegramApiUrl}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
          disable_notification: false,
        }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          const errorText = await response.text()
          errorData = { error: errorText }
        }
        console.error('Telegram API error:', errorData)
        // Если не удалось отправить фото, попробуем отправить текст
        if (errorData.error_code === 400) {
          return await sendTelegramMessage(chatId, text, undefined, replyMarkup)
        }
        return null
      }

      return await response.json()
    } else {
      // Отправляем текстовое сообщение
      const response = await fetch(`${telegramApiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      })

      if (!response.ok) {
        let error
        try {
          const errorJson = await response.json()
          error = errorJson.description || errorJson.error || JSON.stringify(errorJson)
        } catch {
          error = await response.text()
        }
        console.error('Telegram API error:', error)
        return null
      }

      return await response.json()
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return null
  }
}

// Обработка команды /start
async function handleStartCommand(chatId: number, userId: number, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://course-sport.vercel.app'
  
  // URL изображения кето-диеты (используем из public/img)
  const photoUrl = `${appUrl}/img/keto_course.png`

  const welcomeText = `🎉 <b>Привет, ${firstName}!</b>

🔥 Добро пожаловать в <b>Course Health</b> — твой путь к идеальной форме!

🥑 <b>Что тебя ждет:</b>
• Кето-диета: наука жиросжигания
• Интервальное голодание: режим дня для энергии  
• Вкусные рецепты и планы питания
• Отслеживание прогресса

💪 <b>15% контента бесплатно!</b>
Полный доступ за 1500₽

🚀 Нажми кнопку ниже, чтобы начать обучение прямо сейчас!`

  // Кнопка для открытия WebApp
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🚀 Открыть приложение',
          web_app: {
            url: appUrl,
          },
        },
      ],
      [
        {
          text: '📚 Посмотреть курсы',
          url: `${appUrl}/courses.html`,
        },
        {
          text: '💚 О нас',
          url: `${appUrl}/about.html`,
        },
      ],
    ],
  }

  return await sendTelegramMessage(chatId, welcomeText, photoUrl, replyMarkup)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json() as TelegramUpdate

    // Проверка webhook secret (опционально)
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (webhookSecret) {
      const secret = request.headers.get('x-telegram-bot-api-secret-token')
      if (secret !== webhookSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Обработка сообщения
    if (body.message) {
      const { message } = body
      const chatId = message.chat.id
      const userId = message.from.id
      const firstName = message.from.first_name
      const text = message.text

      // Обработка команды /start
      if (text === '/start' || text?.startsWith('/start')) {
        await handleStartCommand(chatId, userId, firstName)

        // Сохраняем информацию о пользователе в Supabase (опционально)
        try {
          const { error } = await supabase
            .from('users')
            .upsert(
              {
                telegram_id: String(userId),
                name: firstName,
                telegram_username: message.from.username || null,
                telegram_verified: true,
              },
              {
                onConflict: 'telegram_id',
              }
            )

          if (error) {
            console.error('Error saving user:', error)
          }
        } catch (error) {
          console.error('Error in user save:', error)
        }

        return NextResponse.json({ success: true, handled: 'start_command' })
      }

      // Можно добавить обработку других команд здесь
      // Например: /help, /courses, /profile и т.д.
    }

    // Обработка callback_query (нажатия на кнопки)
    if (body.callback_query) {
      const { callback_query } = body
      const data = callback_query.data
      const chatId = callback_query.message?.chat.id

      if (chatId && data) {
        // Обработка нажатий на кнопки
        // Например, можно обработать разные callback_data
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
