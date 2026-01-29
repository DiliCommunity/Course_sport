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
    const { userId, isPartner, commissionPercent = 15 } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      is_referral_partner: isPartner
    }

    if (isPartner) {
      updateData.referral_commission_percent = commissionPercent
    }

    const { error } = await adminSupabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: isPartner ? 'Реферальная программа активирована' : 'Реферальная программа отключена'
    })

  } catch (error) {
    console.error('Error toggling partner:', error)
    return NextResponse.json(
      { error: 'Ошибка при изменении статуса' },
      { status: 500 }
    )
  }
}

