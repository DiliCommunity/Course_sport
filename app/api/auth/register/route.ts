import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, name, phone, referral_code } = body

    // Регистрация по email
    if (email && password && name) {
      // Получаем реферальный код из query параметров или body
      const referralCode = request.nextUrl.searchParams.get('ref') || referral_code

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
            referral_code: referralCode || null,
          },
        },
      })

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Registration failed' },
          { status: 400 }
        )
      }

      // Обновляем метод регистрации в профиле
      if (data.user) {
        await supabase
          .from('users')
          .update({ registration_method: 'email' })
          .eq('id', data.user.id)
      }

      return NextResponse.json({
        success: true,
        user_id: data.user?.id,
        email: data.user?.email,
        access_token: data.session?.access_token,
        user: data.user,
        session: data.session,
        message: data.session 
          ? 'Регистрация успешна!' 
          : 'Регистрация успешна. Проверьте email для подтверждения.',
      })
    }

    // Регистрация по телефону (отправка OTP)
    if (phone && name) {
      // Форматируем телефон: убираем все кроме цифр и добавляем +
      let cleanedPhone = phone.replace(/\D/g, '')
      if (cleanedPhone.startsWith('8')) {
        cleanedPhone = '7' + cleanedPhone.substring(1)
      }
      if (!cleanedPhone.startsWith('7')) {
        cleanedPhone = '7' + cleanedPhone
      }
      const formattedPhone = '+' + cleanedPhone

      // Получаем реферальный код
      const referralCode = request.nextUrl.searchParams.get('ref') || referral_code

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            name,
            full_name: name,
            referral_code: referralCode || null,
          },
        },
      })

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to send OTP' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'OTP code sent to your phone. Please verify to complete registration.',
        phone: formattedPhone,
      })
    }

    return NextResponse.json(
      { error: 'Email/password/name or phone/name required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
