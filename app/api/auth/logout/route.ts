import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()
    
    // Получаем токен сессии
    const sessionToken = cookieStore.get('session_token')?.value

    if (sessionToken) {
      // Деактивируем сессию в БД
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('token', sessionToken)
    }

    // Удаляем cookies
    cookieStore.delete('session_token')
    cookieStore.delete('telegram_id')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
