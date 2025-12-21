import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, name, phone } = body

    // Регистрация по email
    if (email && password && name) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      })

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Registration failed' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
        message: 'Registration successful. Please check your email to verify your account.',
      })
    }

    // Регистрация по телефону (отправка OTP)
    if (phone && name) {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          data: {
            name,
            full_name: name,
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
