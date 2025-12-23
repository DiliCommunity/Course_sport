import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// То же хеширование что и при регистрации
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'course_health_salt_2024').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { username, password } = body

    // Валидация
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    // Ищем пользователя по логину
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (findError || !user) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    const passwordHash = hashPassword(password)
    
    if (user.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Обновляем last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      user_id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      message: 'Вход выполнен успешно!'
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
