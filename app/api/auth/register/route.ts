import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Безопасное хеширование пароля с использованием PBKDF2
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex')
  const iterations = 10000
  const keyLength = 64
  
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    iterations,
    keyLength,
    'sha512'
  ).toString('hex')
  
  // Сохраняем в формате: iterations:salt:hash
  return `${iterations}:${salt}:${hash}`
}

// Проверка пароля (используется в login route)
function verifyPassword(password: string, storedHash: string): boolean {
  const [iterations, salt, hash] = storedHash.split(':')
  
  const verifyHash = crypto.pbkdf2Sync(
    password,
    salt,
    parseInt(iterations),
    64,
    'sha512'
  ).toString('hex')
  
  return hash === verifyHash
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

    // Хешируем пароль безопасным способом
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
        registration_method: 'username'
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

    // Обрабатываем реферальный код если есть
    if (referralCode) {
      try {
        // Находим владельца реферального кода
        const { data: referralOwner } = await supabase
          .from('user_referral_codes')
          .select('user_id')
          .eq('referral_code', referralCode)
          .eq('is_active', true)
          .single()

        if (referralOwner && referralOwner.user_id !== userId) {
          // Создаем запись о реферале
          await supabase
            .from('referrals')
            .insert({
              referrer_id: referralOwner.user_id,
              referred_id: userId,
              referral_code: referralCode,
              status: 'active',
              referred_bonus: 10000, // 100 рублей
              commission_percent: 10.00
            })

          // Обновляем статистику кода
          const { data: codeData } = await supabase
            .from('user_referral_codes')
            .select('total_uses')
            .eq('referral_code', referralCode)
            .single()

          if (codeData) {
            await supabase
              .from('user_referral_codes')
              .update({ total_uses: (codeData.total_uses || 0) + 1 })
              .eq('referral_code', referralCode)
          }
        }
      } catch (refError) {
        console.error('Referral processing error:', refError)
        // Не блокируем регистрацию если реферальный код не найден
      }
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
