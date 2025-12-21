import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Проверка OTP кода и авторизация
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { phone, token, otp, name } = body

    const otpCode = token || otp

    if (!phone || !otpCode) {
      return NextResponse.json(
        { error: 'Phone and OTP code are required' },
        { status: 400 }
      )
    }

    // Проверяем OTP код
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otpCode,
      type: 'sms',
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Invalid OTP code' },
        { status: 401 }
      )
    }

    // Если пользователь новый и указано имя, обновляем профиль
    if (data.user && name) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name,
          registration_method: 'phone',
          phone_verified: true,
        })
        .eq('id', data.user.id)

      if (updateError) {
        console.error('Update profile error:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
