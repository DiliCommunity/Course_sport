import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/vercel/kv'
import { createUserSession } from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Создаём пользователя
    const user = await createUser({
      email,
      name,
      password,
    })

    const sessionId = await createUserSession(user.id)

    return NextResponse.json({
      success: true,
      user_id: user.id,
      email: user.email,
      session_id: sessionId,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
