import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Telegram Webhook для обработки сообщений от бота
export async function POST(request: NextRequest) {
  try {
    // Проверка токена бота (для будущего использования)
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not configured - webhook will work but bot features may be limited')
    }

    const body = await request.json()
    
    // Обработка команды /start
    if (body.message?.text?.startsWith('/start')) {
      const user = body.message.from
      
      // Создаём клиент Supabase только при выполнении запроса
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not configured')
        return NextResponse.json({ ok: true })
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Сохраняем пользователя в БД
      await supabase.from('users').upsert({
        telegram_id: String(user.id),
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        telegram_username: user.username || null,
      } as never, {
        onConflict: 'telegram_id'
      })
      
      return NextResponse.json({ ok: true })
    }
    
    // Обработка web_app_data (данные из Mini App)
    if (body.message?.web_app_data) {
      const data = JSON.parse(body.message.web_app_data.data)
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
