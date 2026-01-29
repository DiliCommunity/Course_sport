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
    const { reviewId, approve } = body

    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId обязателен' },
        { status: 400 }
      )
    }

    const { error } = await adminSupabase
      .from('reviews')
      .update({ 
        is_approved: approve,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: approve ? 'Отзыв одобрен' : 'Отзыв скрыт'
    })

  } catch (error) {
    console.error('Error approving review:', error)
    return NextResponse.json(
      { error: 'Ошибка при изменении статуса отзыва' },
      { status: 500 }
    )
  }
}

