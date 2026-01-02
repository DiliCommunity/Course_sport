import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Генерация токена сессии
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Поддерживаем оба формата - telegramUser и прямые поля
    const telegramData = body.telegramUser || body
    const { id, first_name, last_name, username, photo_url } = telegramData as {
      id: number
      first_name: string
      last_name?: string
      username?: string
      photo_url?: string
    }

    if (!id || !first_name) {
      return NextResponse.json(
        { error: 'Telegram user data is required' },
        { status: 400 }
      )
    }

    const telegramId = String(id)
    const name = `${first_name} ${last_name || ''}`.trim()
    const telegramUsername = username || `user_${telegramId}`

    // Проверяем, есть ли пользователь с таким telegram_id
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Find user error:', findError)
    }

    let userId: string
    let isNewUser = false

    if (existingUser) {
      // Пользователь существует - обновляем данные
      userId = existingUser.id
      
      await supabase
        .from('users')
        .update({
          name,
          telegram_username: telegramUsername,
          avatar_url: photo_url || existingUser.avatar_url,
          telegram_verified: true,
          last_login: new Date().toISOString(),
        })
        .eq('id', userId)
        
      console.log('Telegram user logged in:', userId)
      
      // Обрабатываем реферальный код если он есть (для существующих пользователей)
      // Получаем реферальный код из body (может быть передан с клиента)
      const referralCode = body.referralCode || body.referral_code
      
      if (referralCode) {
        try {
          // Проверяем, не привязан ли уже реферер у этого пользователя
          const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id, referrer_id')
            .eq('referred_id', userId)
            .single()
          
          // Если реферера еще нет и код валидный - создаем связь
          if (!existingReferral) {
            const { data: referralOwner } = await supabase
              .from('user_referral_codes')
              .select('user_id')
              .eq('referral_code', referralCode)
              .eq('is_active', true)
              .single()

            if (referralOwner && referralOwner.user_id !== userId) {
              const COMMISSION_PERCENT = 30.00

              // Создаем запись о реферале с 30% комиссией
              await supabase
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

              // Обновляем статистику использования кода
              const { data: currentCode } = await supabase
                .from('user_referral_codes')
                .select('total_uses')
                .eq('referral_code', referralCode)
                .single()

              await supabase
                .from('user_referral_codes')
                .update({ 
                  total_uses: (currentCode?.total_uses || 0) + 1
                })
                .eq('referral_code', referralCode)

              console.log(`✅ Реферальная связь создана для существующего пользователя: ${referralCode}, комиссия ${COMMISSION_PERCENT}%`)
            }
          } else {
            console.log('⚠️ У пользователя уже есть реферер, пропускаем обработку кода:', referralCode)
          }
        } catch (refError) {
          console.error('Referral processing error (existing user):', refError)
          // Не блокируем авторизацию если реферальный код не найден
        }
      }
    } else {
      // Создаём нового пользователя
      isNewUser = true
      userId = crypto.randomUUID()
      
      // Генерируем уникальный username для пользователя
      const userUsername = `tg_${telegramUsername}_${telegramId.slice(-4)}`
      
      // Создаём запись с пустым паролем (вход только через Telegram)
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: userUsername,
          password_hash: 'telegram_auth_only', // Специальный маркер - вход только через Telegram
          name,
          telegram_id: telegramId,
          telegram_username: telegramUsername,
          avatar_url: photo_url || null,
          telegram_verified: true,
          registration_method: 'telegram',
        })

      if (insertError) {
        console.error('Create user error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user: ' + insertError.message },
          { status: 500 }
        )
      }

      console.log('New Telegram user created:', userId)
      
      // Обрабатываем реферальный код для нового пользователя
      const referralCode = body.referralCode || body.referral_code
      
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
            const COMMISSION_PERCENT = 30.00

            // Создаем запись о реферале с 30% комиссией
            await supabase
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

            // Обновляем статистику использования кода
            const { data: currentCode } = await supabase
              .from('user_referral_codes')
              .select('total_uses')
              .eq('referral_code', referralCode)
              .single()

            await supabase
              .from('user_referral_codes')
              .update({ 
                total_uses: (currentCode?.total_uses || 0) + 1
              })
              .eq('referral_code', referralCode)

            console.log(`✅ Реферальная связь создана для нового пользователя: ${referralCode}, комиссия ${COMMISSION_PERCENT}%`)
          }
        } catch (refError) {
          console.error('Referral processing error (new user):', refError)
          // Не блокируем регистрацию если реферальный код не найден
        }
      }
    }

    // Создаём сессию
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Сессия на 30 дней

    // Удаляем старые сессии этого пользователя (опционально)
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_type', 'telegram')

    // Создаём новую сессию
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token: sessionToken,
        session_type: 'telegram',
        telegram_id: telegramId,
        user_agent: request.headers.get('user-agent') || null,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (sessionError) {
      console.error('Create session error:', sessionError)
      // Продолжаем без сессии - не критичная ошибка
    }

    // Устанавливаем cookie с токеном сессии
    // БЕЗ maxAge - session cookie, удалится при закрытии браузера/приложения
    const cookieStore = await cookies()
    
    // Для Telegram WebApp (cross-site iframe) нужен sameSite: 'none' и secure: true
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: true, // Обязательно для sameSite: 'none'
      sameSite: 'none', // Необходимо для cross-site (Telegram WebApp)
      path: '/',
      // maxAge НЕ указываем - это session cookie
    })

    // Также сохраняем telegram_id для быстрой проверки на клиенте
    cookieStore.set('telegram_id', telegramId, {
      httpOnly: false, // Клиент может читать
      secure: true, // Обязательно для sameSite: 'none'
      sameSite: 'none', // Необходимо для cross-site
      path: '/',
      // maxAge НЕ указываем - это session cookie
    })

    return NextResponse.json({
      success: true,
      userId,
      telegramId,
      isNewUser,
      message: isNewUser ? 'Регистрация успешна!' : 'Вход выполнен успешно!',
    })

  } catch (error: any) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
