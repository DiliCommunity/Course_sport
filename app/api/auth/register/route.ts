import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Генерация токена сессии
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { username, password, name, email, phone, referralCode, telegram_id, telegram_username } = body

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
        telegram_id: telegram_id || null,
        telegram_username: telegram_username || null,
        telegram_verified: telegram_id ? true : false,
        registration_method: telegram_id ? 'telegram' : 'username'
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

    // Обрабатываем реферальный код если есть (используем admin client для обхода RLS)
    if (referralCode) {
      try {
        const adminSupabase = createAdminClient()
        
        if (!adminSupabase) {
          console.error('Admin client not available for referral processing')
        } else {
          // Находим владельца реферального кода
          const { data: referralOwner } = await adminSupabase
            .from('user_referral_codes')
            .select('user_id')
            .eq('referral_code', referralCode)
            .eq('is_active', true)
            .maybeSingle()

          if (referralOwner && referralOwner.user_id !== userId) {
            // БЕЗ бонусов при регистрации - только 30% комиссия с покупок
            const COMMISSION_PERCENT = 30.00

            // Создаем запись о реферале с 30% комиссией (используем admin client)
            const { data: newReferral, error: referralInsertError } = await adminSupabase
              .from('referrals')
              .insert({
                referrer_id: referralOwner.user_id,
                referred_id: userId,
                referral_code: referralCode,
                status: 'active',
                referred_bonus: 0,
                referrer_earned: 0,
                commission_percent: COMMISSION_PERCENT
              })
              .select()
              .single()

            if (referralInsertError) {
              console.error('❌ Ошибка создания записи в referrals:', referralInsertError)
            } else {
              console.log(`✅ Реферальная связь создана: ${referralCode}, commission ${COMMISSION_PERCENT}%`)
            }

            // Обновляем статистику использования кода (используем admin client)
            const { data: currentCode } = await adminSupabase
              .from('user_referral_codes')
              .select('total_uses')
              .eq('referral_code', referralCode)
              .maybeSingle()

            if (currentCode) {
              const { error: updateError } = await adminSupabase
                .from('user_referral_codes')
                .update({ 
                  total_uses: (currentCode.total_uses || 0) + 1
                })
                .eq('referral_code', referralCode)

              if (updateError) {
                console.error('❌ Ошибка обновления total_uses:', updateError)
              }
            }
          } else {
            console.log(`⚠️ Реферальный код не найден или пользователь пытается использовать свой код: ${referralCode}`)
          }
        }
      } catch (refError) {
        console.error('❌ Referral processing error:', refError)
        // Не блокируем регистрацию если реферальный код не найден
      }
    }

    // Создаём сессию автоматически после регистрации
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + telegram_id ? 30 : 7) // Telegram - 30 дней, web - 7 дней

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token: sessionToken,
        session_type: telegram_id ? 'telegram' : 'web',
        telegram_id: telegram_id || null,
        user_agent: request.headers.get('user-agent') || null,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (sessionError) {
      console.error('Create session error:', sessionError)
    }

    // Устанавливаем cookies
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    // Если регистрация из Telegram - устанавливаем telegram_id cookie
    if (telegram_id) {
      cookieStore.set('telegram_id', telegram_id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      })
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
