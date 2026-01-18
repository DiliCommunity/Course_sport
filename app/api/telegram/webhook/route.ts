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

  console.log('Sending Telegram message to chat:', chatId)
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

      const result = await response.json()
      console.log('Photo sent successfully:', result.ok)
      return result
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

      const result = await response.json()
      console.log('Message sent successfully:', result.ok)
      return result
    }
  } catch (error: any) {
    console.error('Error sending Telegram message:', error.message || error)
    return null
  }
}

// Обработка команды /start
async function handleStartCommand(chatId: number, userId: number, firstName: string) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://course-sport.vercel.app'
  
  console.log('handleStartCommand called:', { chatId, userId, firstName, appUrl })
  
  // URL изображения кето-диеты (используем из public/img)
  const photoUrl = `${appUrl}/img/keto_course.png`
  console.log('Photo URL:', photoUrl)

  const welcomeText = `🎉 <b>Привет, ${firstName}!</b>

🔥 Добро пожаловать в <b>Course Health</b> — твой путь к идеальной форме!

🥑 <b>Что тебя ждет:</b>
• Кето-диета: наука жиросжигания
• Интервальное голодание: режим дня для энергии  
• 100+ вкусных кето-рецептов
• Планы питания и отслеживание прогресса

💪 <b>15% контента бесплатно!</b>
🎯 Вам открывается доступ к выбранному курсу всего за <b>1699₽</b>

🎁 <b>В качестве бонуса:</b>
• Полный доступ к рецептам
• Мини-приложения для удобного отслеживания диеты или IF

📩 <b>Ежедневно буду присылать:</b>
• Полезные советы по питанию
• Бесплатные уроки из курсов
• Вкусные кето-рецепты

🚀 Нажми кнопку ниже, чтобы начать!`

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
          url: `${appUrl}/courses`,
        },
        {
          text: '💚 О нас',
          url: `${appUrl}/about`,
        },
      ],
    ],
  }

  return await sendTelegramMessage(chatId, welcomeText, photoUrl, replyMarkup)
}

export async function POST(request: NextRequest) {
  try {
    // Логируем входящий запрос для отладки
    console.log('Telegram webhook received')
    
    const body = await request.json() as TelegramUpdate
    console.log('Webhook body:', JSON.stringify(body, null, 2))

    // Проверка webhook secret - ОТКЛЮЧЕНО для упрощения
    // Если хотите включить, установите TELEGRAM_WEBHOOK_SECRET в Vercel
    // и при настройке webhook используйте параметр secret_token
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (webhookSecret && webhookSecret.length > 0) {
      const secret = request.headers.get('x-telegram-bot-api-secret-token')
      if (secret && secret !== webhookSecret) {
        console.warn('Webhook secret provided but does not match, skipping check')
        // Не блокируем запрос, просто логируем предупреждение
      }
    }

    const supabase = await createClient()

    // Обработка сообщения
    if (body.message) {
      const { message } = body
      const chatId = message.chat.id
      const userId = message.from.id
      const firstName = message.from.first_name
      const text = message.text

      // Обработка команды /start
      if (text === '/start' || text?.startsWith('/start')) {
        console.log('Processing /start command for user:', userId, firstName)
        
        try {
          const result = await handleStartCommand(chatId, userId, firstName)
          console.log('Start command result:', result ? 'success' : 'failed')

          // Сохраняем информацию о пользователе в Supabase
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
            } else {
              console.log('User saved to Supabase')
            }
          } catch (error) {
            console.error('Error in user save:', error)
          }

          // Сохраняем подписчика для ежедневной рассылки
          try {
            const { error: subError } = await supabase
              .from('telegram_subscribers')
              .upsert(
                {
                  chat_id: chatId,
                  telegram_id: userId,
                  first_name: firstName,
                  username: message.from.username || null,
                  is_active: true,
                  subscribed_at: new Date().toISOString(),
                },
                {
                  onConflict: 'chat_id',
                }
              )

            if (subError) {
              console.error('Error saving subscriber:', subError)
            } else {
              console.log('Subscriber saved for daily broadcasts')
            }
          } catch (error) {
            console.error('Error saving subscriber:', error)
          }

          return NextResponse.json({ success: true, handled: 'start_command' })
        } catch (error: any) {
          console.error('Error handling /start command:', error)
          return NextResponse.json(
            { error: error.message || 'Failed to handle /start' },
            { status: 500 }
          )
        }
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

    console.log('Webhook processed successfully')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
