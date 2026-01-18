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

    console.log('[Promotions Check] Request received, promotionId:', promotionId)

    if (!promotionId) {
      console.error('[Promotions Check] Promotion ID required')
      return NextResponse.json({ error: 'Promotion ID required' }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (supabaseError: any) {
      console.error('[Promotions Check] Error creating supabase client:', supabaseError)
      return NextResponse.json(
        { error: 'Failed to initialize database connection: ' + (supabaseError.message || 'Unknown error') },
        { status: 500 }
      )
    }

    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch (adminError: any) {
      console.error('[Promotions Check] Error creating admin client:', adminError)
      return NextResponse.json(
        { error: 'Server configuration error: ' + (adminError.message || 'Unknown error') },
        { status: 500 }
      )
    }

    if (!adminSupabase) {
      console.error('[Promotions Check] Admin client is null')
      return NextResponse.json({ error: 'Server configuration error: Admin client not available' }, { status: 500 })
    }

    // Получаем текущего пользователя (опционально, для проверки его использования акции)
    let currentUser = null
    let userHasUsedPromotion = false
    
    try {
      currentUser = await getUserFromSession(supabase)
      console.log('[Promotions Check] Current user:', currentUser ? currentUser.id : 'null')
      
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

        if (userPaymentError) {
          console.error('[Promotions Check] Error checking user payments:', userPaymentError)
        } else if (userPayments && userPayments.length > 0) {
          userHasUsedPromotion = true
          console.log('[Promotions Check] User has already used this promotion')
        }
      }
    } catch (userError: any) {
      // Пользователь не авторизован - это нормально, акция может быть доступна и без авторизации
      console.log('[Promotions Check] User not authenticated or error getting user:', userError?.message || userError)
    }

    // Для акции "первым 100 студентам"
    if (promotionId === 'first_100') {
      console.log('[Promotions Check] Checking first_100 promotion')
      
      // Получаем количество УНИКАЛЬНЫХ пользователей, которые уже воспользовались акцией
      // Используем distinct по user_id для подсчета уникальных студентов
      let payments
      let error
      
      try {
        const result = await adminSupabase
          .from('payments')
          .select('user_id')
          .eq('status', 'completed')
          .eq('type', 'promotion')
          .eq('promotion_id', 'first_100')
        
        payments = result.data
        error = result.error
      } catch (queryError: any) {
        console.error('[Promotions Check] Error executing query:', queryError)
        return NextResponse.json(
          { error: 'Database query error: ' + (queryError.message || 'Unknown error') },
          { status: 500 }
        )
      }

      if (error) {
        console.error('[Promotions Check] Error counting promotion users:', error)
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

      console.log('[Promotions Check] Promotion status:', {
        usedSlots,
        availableSlots,
        isAvailable,
        userHasUsedPromotion
      })

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
    console.error('[Promotions Check] Unexpected error:', error)
    console.error('[Promotions Check] Error stack:', error?.stack)
    return NextResponse.json(
      { error: error?.message || 'Server error: ' + String(error) || 'Unknown error' },
      { status: 500 }
    )
  }
}

