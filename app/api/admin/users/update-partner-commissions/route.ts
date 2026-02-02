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

    // Находим всех партнёров с комиссией 15%
    const { data: partners, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, name, email, referral_commission_percent')
      .eq('is_referral_partner', true)
      .eq('referral_commission_percent', 15)

    if (fetchError) {
      console.error('Error fetching partners:', fetchError)
      return NextResponse.json(
        { error: 'Ошибка при получении партнёров' },
        { status: 500 }
      )
    }

    if (!partners || partners.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Партнёров с комиссией 15% не найдено',
        updated: 0
      })
    }

    // Обновляем всех на 10%
    const { data: updated, error: updateError } = await adminSupabase
      .from('users')
      .update({ referral_commission_percent: 10 })
      .eq('is_referral_partner', true)
      .eq('referral_commission_percent', 15)
      .select('id, name, email')

    if (updateError) {
      console.error('Error updating partners:', updateError)
      return NextResponse.json(
        { error: 'Ошибка при обновлении партнёров' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Успешно обновлено ${updated?.length || 0} партнёров`,
      updated: updated?.length || 0,
      partners: updated
    })

  } catch (error) {
    console.error('Error updating partner commissions:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении комиссий' },
      { status: 500 }
    )
  }
}

