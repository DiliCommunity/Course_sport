import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, first_name, last_name, username, photo_url, phone_number } = body as {
      id: number
      first_name: string
      last_name?: string
      username?: string
      photo_url?: string
      phone_number?: string
    }

    if (!id || !first_name) {
      return NextResponse.json(
        { error: 'Telegram user data is required' },
        { status: 400 }
      )
    }

    const telegramId = String(id)
    const name = `${first_name} ${last_name || ''}`.trim()

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

    if (existingUser) {
      // Пользователь существует, обновляем данные
      userId = existingUser.id

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          telegram_username: username || null,
          avatar_url: photo_url || null,
          telegram_verified: true,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Update user error:', updateError)
      }
    } else {
      // Новый пользователь - создаем через Supabase Auth
      // Если есть номер телефона, используем его для авторизации
      if (phone_number) {
        // Отправляем OTP на телефон
        const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
          phone: phone_number,
          options: {
            data: {
              name,
              full_name: name,
              telegram_id: telegramId,
              telegram_username: username,
            },
          },
        })

        if (otpError) {
          return NextResponse.json(
            { error: otpError.message || 'Failed to send OTP' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          requires_otp: true,
          message: 'OTP code sent to your phone. Please verify to complete registration.',
        })
      } else {
        // Если нет телефона, создаем пользователя с email (временный)
        // В реальном приложении лучше требовать телефон
        const tempEmail = `telegram_${telegramId}@temp.com`
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: crypto.randomUUID(), // Временный пароль
          options: {
            data: {
              name,
              full_name: name,
              telegram_id: telegramId,
              telegram_username: username,
            },
          },
        })

        if (signUpError) {
          return NextResponse.json(
            { error: signUpError.message || 'Registration failed' },
            { status: 400 }
          )
        }

        // Обновляем профиль с Telegram данными
        if (signUpData.user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              telegram_id: telegramId,
              telegram_username: username,
              avatar_url: photo_url || null,
              telegram_verified: true,
            })
            .eq('id', signUpData.user.id)

          if (updateError) {
            console.error('Update profile error:', updateError)
          }
        }

        return NextResponse.json({
          success: true,
          user: signUpData.user,
          session: signUpData.session,
        })
      }
    }

    // Если пользователь уже существует, получаем сессию
    const { data: { user } } = await supabase.auth.getUser()

    return NextResponse.json({
      success: true,
      user_id: userId,
      telegram_id: telegramId,
    })
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
