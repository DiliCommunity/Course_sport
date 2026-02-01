import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

// Получение примененных промокодов пользователя
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Ошибка сервера' },
        { status: 500 }
      )
    }

    // Получаем примененные промокоды пользователя с информацией о промокоде
    const { data: userPromocodes, error } = await adminSupabase
      .from('user_promocodes')
      .select(`
        id,
        discount_applied,
        created_at,
        promocodes (
          id,
          code,
          discount_percent,
          discount_amount,
          promo_type,
          description,
          course_id,
          valid_until
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user promocodes:', error)
      return NextResponse.json(
        { error: 'Ошибка получения промокодов' },
        { status: 500 }
      )
    }

    // Фильтруем только промокоды со скидкой (не referral_access)
    const discountPromocodes = (userPromocodes || [])
      .filter((up: any) => up.promocodes && up.promocodes.promo_type !== 'referral_access')
      .map((up: any) => ({
        id: up.id,
        promocodeId: up.promocodes.id,
        code: up.promocodes.code,
        discountPercent: up.promocodes.discount_percent,
        discountAmount: up.promocodes.discount_amount,
        promoType: up.promocodes.promo_type,
        description: up.promocodes.description,
        courseId: up.promocodes.course_id,
        validUntil: up.promocodes.valid_until,
        discountApplied: up.discount_applied,
        createdAt: up.created_at
      }))

    return NextResponse.json({
      success: true,
      promocodes: discountPromocodes
    })

  } catch (error) {
    console.error('Error getting user promocodes:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении промокодов' },
      { status: 500 }
    )
  }
}

