import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Временная заглушка - загрузка аватаров отключена
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Возвращаем заглушку - иконка будет отображаться на клиенте
    return NextResponse.json({ 
      avatar_url: null,
      message: 'Avatar upload temporarily disabled' 
    })
  } catch (error: any) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
