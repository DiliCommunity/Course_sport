import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
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
    const tempEmail = `telegram_${telegramId}@temp.com`
    const tempPassword = `tg_${telegramId}_${Date.now()}`

    // Проверяем, есть ли пользователь с таким telegram_id в таблице users
    const { data: existingProfile, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Find user error:', findError)
    }

    if (existingProfile) {
      // Пользователь существует - пробуем войти
      console.log('Existing user found:', existingProfile.id)
      
      // Обновляем данные профиля
      await supabase
        .from('users')
        .update({
          name,
          telegram_username: username || null,
          avatar_url: photo_url || existingProfile.avatar_url,
          telegram_verified: true,
        })
        .eq('id', existingProfile.id)

      // Пробуем войти с временными данными
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: tempPassword,
      })

      if (signInData?.session) {
        console.log('Sign in successful with existing credentials')
        return NextResponse.json({
          success: true,
          user_id: existingProfile.id,
          user: signInData.user,
          session: signInData.session,
        })
      }

      // Если не удалось войти, возвращаем user_id без сессии
      // Фронтенд должен запросить OTP или другой метод входа
      console.log('Sign in failed, returning user_id without session')
      return NextResponse.json({
        success: true,
        user_id: existingProfile.id,
        telegram_id: telegramId,
        message: 'User exists but session not created',
      })
    }

    // Новый пользователь - создаем через Admin API (без подтверждения email)
    console.log('Creating new user for Telegram ID:', telegramId)

    if (adminClient) {
      // Используем Admin API для создания пользователя
      const { data: adminCreateData, error: adminCreateError } = await adminClient.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true, // Автоматически подтверждаем email
        user_metadata: {
          name,
          full_name: name,
          telegram_id: telegramId,
          telegram_username: username,
        },
      })

      if (adminCreateError) {
        console.error('Admin create user error:', adminCreateError)
        return NextResponse.json(
          { error: adminCreateError.message || 'Failed to create user' },
          { status: 400 }
        )
      }

      if (adminCreateData.user) {
        // Обновляем профиль с Telegram данными
        const { error: updateError } = await supabase
          .from('users')
          .update({
            telegram_id: telegramId,
            telegram_username: username,
            avatar_url: photo_url || null,
            telegram_verified: true,
            registration_method: 'telegram',
          })
          .eq('id', adminCreateData.user.id)

        if (updateError) {
          console.error('Update profile error:', updateError)
        }

        // Теперь входим с созданными данными
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: tempPassword,
        })

        if (signInError) {
          console.error('Sign in after create error:', signInError)
          // Возвращаем успех даже без сессии
          return NextResponse.json({
            success: true,
            user_id: adminCreateData.user.id,
            user: adminCreateData.user,
            message: 'User created but session not established',
          })
        }

        console.log('User created and signed in successfully')
        return NextResponse.json({
          success: true,
          user_id: adminCreateData.user.id,
          user: signInData?.user || adminCreateData.user,
          session: signInData?.session,
        })
      }
    } else {
      // Fallback: создаем через обычный signUp (требует подтверждения email)
      console.warn('Admin client not available, using regular signUp')
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
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

      // Обновляем профиль
      if (signUpData.user) {
        await supabase
          .from('users')
          .update({
            telegram_id: telegramId,
            telegram_username: username,
            avatar_url: photo_url || null,
            telegram_verified: true,
            registration_method: 'telegram',
          })
          .eq('id', signUpData.user.id)
      }

      return NextResponse.json({
        success: true,
        user: signUpData.user,
        session: signUpData.session,
        message: signUpData.session ? 'Registration successful' : 'Please check email to confirm',
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
    }, { status: 500 })

  } catch (error: any) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
