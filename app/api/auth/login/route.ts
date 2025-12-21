import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, phone, otp } = body

    // Авторизация по email
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error.message)
        return NextResponse.json(
          { error: error.message || 'Неверный email или пароль' },
          { status: 401 }
        )
      }

      // Возвращаем данные в формате, который ожидает клиент
      return NextResponse.json({
        success: true,
        user_id: data.user?.id,
        email: data.user?.email,
        access_token: data.session?.access_token,
        user: data.user,
        session: data.session,
      })
    }

    // Авторизация по телефону (OTP)
    if (phone && otp) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      })

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Неверный код подтверждения' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user_id: data.user?.id,
        phone: data.user?.phone,
        access_token: data.session?.access_token,
        user: data.user,
        session: data.session,
      })
    }

    return NextResponse.json(
      { error: 'Необходимо указать email и пароль' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
