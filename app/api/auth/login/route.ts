import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Генерация токена сессии
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Проверка пароля (PBKDF2)
function verifyPassword(password: string, storedHash: string): boolean {
  try {
    // Специальный маркер для пользователей Telegram
    if (storedHash === 'telegram_auth_only') {
      return false
    }
    
    const [iterations, salt, hash] = storedHash.split(':')
    
    if (!iterations || !salt || !hash) {
      return false
    }
    
    const verifyHash = crypto.pbkdf2Sync(
      password,
      salt,
      parseInt(iterations),
      64,
      'sha512'
    ).toString('hex')
    
    return hash === verifyHash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
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

    // Проверяем, не является ли это Telegram-only аккаунтом
    if (user.password_hash === 'telegram_auth_only') {
      return NextResponse.json(
        { error: 'Этот аккаунт зарегистрирован через Telegram. Используйте вход через Telegram.' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Ошибка аутентификации' },
        { status: 401 }
      )
    }

    const isPasswordValid = verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
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

    // Создаём сессию
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Сессия на 7 дней для web

    // Удаляем старые web-сессии этого пользователя
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('session_type', 'web')

    // Создаём новую сессию
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token: sessionToken,
        session_type: 'web',
        user_agent: request.headers.get('user-agent') || null,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (sessionError) {
      console.error('Create session error:', sessionError)
    }

    // Устанавливаем cookie с токеном сессии
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

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
