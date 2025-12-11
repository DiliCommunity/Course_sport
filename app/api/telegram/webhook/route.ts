import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Telegram Webhook для обработки сообщений от бота
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Обработка команды /start
    if (body.message?.text?.startsWith('/start')) {
      const user = body.message.from
      const startParam = body.message.text.split(' ')[1] // deep link параметр
      
      // Сохраняем пользователя в БД
      const supabase = createClient()
      await supabase.from('users').upsert({
        telegram_id: String(user.id),
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        telegram_username: user.username,
      }, {
        onConflict: 'telegram_id'
      })
      
      // Можно отправить ответное сообщение через Telegram Bot API
      // или перенаправить на Mini App
      
      return NextResponse.json({ ok: true })
    }
    
    // Обработка web_app_data (данные из Mini App)
    if (body.message?.web_app_data) {
      const data = JSON.parse(body.message.web_app_data.data)
      // Обработка данных из Mini App
      console.log('Web App Data:', data)
      
      return NextResponse.json({ ok: true })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'telegram-webhook' })
}

