import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Простое хеширование пароля (без bcrypt для избежания зависимостей)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'course_health_salt_2024').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { username, password, name, email, phone, referralCode } = body

    // Валидация
    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Логин, пароль и имя обязательны' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Логин должен быть минимум 3 символа' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть минимум 6 символов' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь с таким логином
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким логином уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const passwordHash = hashPassword(password)

    // Создаем пользователя
    const userId = crypto.randomUUID()
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: username,
        password_hash: passwordHash,
        name: name,
        email: email || null,
        phone: phone || null,
        registration_method: 'username',
        referred_by: referralCode || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Ошибка создания пользователя: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      username: username,
      name: name,
      message: 'Регистрация успешна!'
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
