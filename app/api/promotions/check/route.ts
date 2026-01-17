import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

const PROMOTION_LIMITS = {
  'first_100': 100, // Первым 100 студентам по 1099₽
} as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promotionId = searchParams.get('id')

    if (!promotionId) {
      return NextResponse.json({ error: 'Promotion ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    if (!adminSupabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Получаем текущего пользователя (опционально, для проверки его использования акции)
    let currentUser = null
    let userHasUsedPromotion = false
    
    try {
      currentUser = await getUserFromSession(supabase)
      
      // Проверяем, использовал ли текущий пользователь уже эту акцию
      if (currentUser && promotionId === 'first_100') {
        const { data: userPayments, error: userPaymentError } = await adminSupabase
          .from('payments')
          .select('id, user_id')
          .eq('user_id', currentUser.id)
          .eq('status', 'completed')
          .eq('type', 'promotion')
          .eq('promotion_id', 'first_100')
          .limit(1)

        if (!userPaymentError && userPayments && userPayments.length > 0) {
          userHasUsedPromotion = true
        }
      }
    } catch (userError) {
      // Пользователь не авторизован - это нормально, акция может быть доступна и без авторизации
      console.log('User not authenticated or error getting user:', userError)
    }

    // Для акции "первым 100 студентам"
    if (promotionId === 'first_100') {
      // Получаем количество УНИКАЛЬНЫХ пользователей, которые уже воспользовались акцией
      // Используем distinct по user_id для подсчета уникальных студентов
      const { data: payments, error } = await adminSupabase
        .from('payments')
        .select('user_id')
        .eq('status', 'completed')
        .eq('type', 'promotion')
        .eq('promotion_id', 'first_100')

      if (error) {
        console.error('Error counting promotion users:', error)
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 })
      }

      // Подсчитываем уникальных пользователей
      const uniqueUserIds = new Set<string>()
      if (payments) {
        payments.forEach(payment => {
          if (payment.user_id) {
            uniqueUserIds.add(payment.user_id)
          }
        })
      }

      const usedSlots = uniqueUserIds.size
      const availableSlots = PROMOTION_LIMITS.first_100 - usedSlots
      const isAvailable = availableSlots > 0 && !userHasUsedPromotion // Акция доступна только если места есть И пользователь еще не использовал

      return NextResponse.json({
        promotionId: 'first_100',
        available: isAvailable,
        usedSlots,
        totalSlots: PROMOTION_LIMITS.first_100,
        availableSlots: Math.max(0, availableSlots),
        userHasUsed: userHasUsedPromotion, // Информация о том, использовал ли текущий пользователь акцию
      })
    }

    // Для акции "2 курса за 2199₽" - всегда доступна
    if (promotionId === 'two_courses') {
      return NextResponse.json({
        promotionId: 'two_courses',
        available: true,
      })
    }

    return NextResponse.json({ error: 'Unknown promotion' }, { status: 400 })
  } catch (error: any) {
    console.error('Error checking promotion:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

