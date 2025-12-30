import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
          const REFERRAL_BONUS = 10000 // 100 рублей для нового пользователя
          const REFERRER_BONUS = 5000  // 50 рублей для того кто пригласил
          const COMMISSION_PERCENT = 30.00 // 30% с покупок реферала

          // Создаем запись о реферале с 30% комиссией
          const { data: newReferral } = await supabase
            .from('referrals')
            .insert({
              referrer_id: referralOwner.user_id,
              referred_id: userId,
              referral_code: referralCode,
              status: 'active',
              referred_bonus: REFERRAL_BONUS,
              referrer_earned: REFERRER_BONUS,
              commission_percent: COMMISSION_PERCENT
            })
            .select()
            .single()

          // Получаем текущую статистику кода
          const { data: currentCode } = await supabase
            .from('user_referral_codes')
            .select('total_uses, total_earned')
            .eq('referral_code', referralCode)
            .single()

          // Обновляем статистику кода
          await supabase
            .from('user_referral_codes')
            .update({ 
              total_uses: (currentCode?.total_uses || 0) + 1,
              total_earned: (currentCode?.total_earned || 0) + REFERRER_BONUS
            })
            .eq('referral_code', referralCode)

          // Создаем баланс для нового пользователя с бонусом
          await supabase
            .from('user_balance')
            .upsert({
              user_id: userId,
              balance: REFERRAL_BONUS,
              total_earned: REFERRAL_BONUS,
              total_withdrawn: 0
            })

          // Транзакция для нового пользователя
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              type: 'referral_bonus',
              amount: REFERRAL_BONUS,
              description: 'Бонус 100₽ за регистрацию по реферальной ссылке',
              reference_type: 'referral_registration'
            })

          // Начисляем бонус рефереру
          const { data: referrerBalance } = await supabase
            .from('user_balance')
            .select('balance, total_earned')
            .eq('user_id', referralOwner.user_id)
            .single()

          if (referrerBalance) {
            await supabase
              .from('user_balance')
              .update({
                balance: (referrerBalance.balance || 0) + REFERRER_BONUS,
                total_earned: (referrerBalance.total_earned || 0) + REFERRER_BONUS
              })
              .eq('user_id', referralOwner.user_id)
          } else {
            await supabase
              .from('user_balance')
              .insert({
                user_id: referralOwner.user_id,
                balance: REFERRER_BONUS,
                total_earned: REFERRER_BONUS,
                total_withdrawn: 0
              })
          }

          // Транзакция для реферера
          await supabase
            .from('transactions')
            .insert({
              user_id: referralOwner.user_id,
              type: 'referral_bonus',
              amount: REFERRER_BONUS,
              description: 'Бонус 50₽ за приглашение друга',
              reference_type: 'referral_registration',
              referral_id: newReferral?.id
            })

          console.log(`Referral processed: ${referralCode}, new user gets ${REFERRAL_BONUS/100}₽, referrer gets ${REFERRER_BONUS/100}₽, commission ${COMMISSION_PERCENT}%`)
        }
      } catch (refError) {
        console.error('Referral processing error:', refError)
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
