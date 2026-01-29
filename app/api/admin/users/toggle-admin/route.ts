import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, isAdmin } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      )
    }

    // Нельзя снять права с самого себя
    if (userId === user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Нельзя снять права администратора с себя' },
        { status: 400 }
      )
    }

    const { error } = await adminSupabase
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: isAdmin ? 'Пользователь назначен администратором' : 'Права администратора сняты'
    })

  } catch (error) {
    console.error('Error toggling admin:', error)
    return NextResponse.json(
      { error: 'Ошибка при изменении статуса' },
      { status: 500 }
    )
  }
}

