import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramUser } = body

    if (!telegramUser || !telegramUser.id) {
      return NextResponse.json(
        { error: 'Telegram user data required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const telegramId = String(telegramUser.id)

    // Проверяем, есть ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    let userId: string

    if (existingUser) {
      // Обновляем данные существующего пользователя
      userId = existingUser.id
      await supabase
        .from('users')
        .update({
          name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          telegram_username: telegramUser.username || null,
          avatar_url: telegramUser.photo_url || null,
        } as never)
        .eq('telegram_id', telegramId)
    } else {
      // Создаём нового пользователя
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          telegram_id: telegramId,
          telegram_username: telegramUser.username || null,
          avatar_url: telegramUser.photo_url || null,
        } as never)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      userId = newUser.id
    }

    return NextResponse.json({ 
      success: true, 
      userId,
      telegramId 
    })
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

