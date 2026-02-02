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
    const { userId, isPartner, commissionPercent = 10 } = body

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
      // Если комиссия не указана, используем значение по умолчанию 10%
      // Если указана - используем указанную
      updateData.referral_commission_percent = commissionPercent || 10
      
      // Если у пользователя уже была комиссия 15% (старое значение), обновляем на 10%
      const { data: currentUser } = await adminSupabase
        .from('users')
        .select('referral_commission_percent')
        .eq('id', userId)
        .single()
      
      if (currentUser?.referral_commission_percent === 15) {
        updateData.referral_commission_percent = 10
      }
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

