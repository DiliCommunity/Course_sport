import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

// Проверка промокода без применения (валидация)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { code, courseId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Промокод не указан' },
        { status: 400 }
      )
    }

    // Ищем промокод
    const { data: promocode, error: promoError } = await adminSupabase
      .from('promocodes')
      .select('*')
      .ilike('code', code.trim())
      .eq('is_active', true)
      .single()

    if (promoError || !promocode) {
      return NextResponse.json(
        { error: 'Промокод не найден или недействителен' },
        { status: 404 }
      )
    }

    // Проверяем срок действия
    const now = new Date()
    if (promocode.valid_from && new Date(promocode.valid_from) > now) {
      return NextResponse.json(
        { error: 'Промокод ещё не активен' },
        { status: 400 }
      )
    }
    if (promocode.valid_until && new Date(promocode.valid_until) < now) {
      return NextResponse.json(
        { error: 'Срок действия промокода истёк' },
        { status: 400 }
      )
    }

    // Проверяем лимит активаций
    if (promocode.current_activations >= promocode.max_activations) {
      return NextResponse.json(
        { error: 'Лимит активаций промокода исчерпан' },
        { status: 400 }
      )
    }

    // Проверяем, привязан ли промокод к конкретному курсу
    if (promocode.course_id && courseId && promocode.course_id !== courseId) {
      return NextResponse.json(
        { error: 'Этот промокод не применим к данному курсу' },
        { status: 400 }
      )
    }

    // Проверяем, использовал ли пользователь этот промокод
    const { data: existingUsage } = await adminSupabase
      .from('user_promocodes')
      .select('id')
      .eq('user_id', user.id)
      .eq('promocode_id', promocode.id)
      .single()

    if (existingUsage) {
      return NextResponse.json(
        { error: 'Вы уже использовали этот промокод' },
        { status: 400 }
      )
    }

    // Проверяем тип промокода - только скидочные промокоды можно использовать при оплате
    if (promocode.promo_type === 'referral_access') {
      return NextResponse.json(
        { error: 'Этот промокод не применим к оплате' },
        { status: 400 }
      )
    }

    // Возвращаем данные промокода для применения скидки
    return NextResponse.json({
      success: true,
      promocode: {
        id: promocode.id,
        code: promocode.code,
        discountPercent: promocode.discount_percent,
        discountAmount: promocode.discount_amount,
        description: promocode.description,
        promoType: promocode.promo_type || 'discount',
        courseId: promocode.course_id
      }
    })

  } catch (error) {
    console.error('Error validating promocode:', error)
    return NextResponse.json(
      { error: 'Ошибка при проверке промокода' },
      { status: 500 }
    )
  }
}

