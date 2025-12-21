import { NextRequest, NextResponse } from 'next/server'
import { getUserByTelegramId, createUser, updateUser } from '@/lib/turso/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Обработка webhook от Telegram
    // Здесь можно добавить логику обработки команд и сообщений
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
