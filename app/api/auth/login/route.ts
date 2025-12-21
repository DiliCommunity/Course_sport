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
        return NextResponse.json(
          { error: error.message || 'Invalid email or password' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
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
          { error: error.message || 'Invalid OTP code' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
      })
    }

    return NextResponse.json(
      { error: 'Email/password or phone/otp required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
