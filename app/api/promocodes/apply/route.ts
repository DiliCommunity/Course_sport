import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

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

    const body = await request.json()
    const { code, courseId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Промокод не указан' },
        { status: 400 }
      )
    }

    // Ищем промокод
    const { data: promocode, error: promoError } = await supabase
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
    const { data: existingUsage } = await supabase
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

    // Если это промокод для доступа к реферальной системе - активируем сразу
    if (promocode.promo_type === 'referral_access') {
      const adminSupabase = createAdminClient()
      if (!adminSupabase) {
        return NextResponse.json(
          { error: 'Ошибка сервера' },
          { status: 500 }
        )
      }

      // Получаем комиссию из metadata
      const metadata = promocode.metadata || {}
      const commission = metadata.referral_commission || 15

      // Обновляем пользователя - даём статус реферального партнёра
      const { error: updateError } = await adminSupabase
        .from('users')
        .update({
          is_referral_partner: true,
          referral_commission_percent: commission
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user referral status:', updateError)
        return NextResponse.json(
          { error: 'Ошибка при активации реферальной системы' },
          { status: 500 }
        )
      }

      // Записываем использование промокода
      await adminSupabase
        .from('user_promocodes')
        .insert({
          user_id: user.id,
          promocode_id: promocode.id,
          discount_applied: 0
        })

      // Увеличиваем счётчик активаций
      await adminSupabase
        .from('promocodes')
        .update({ current_activations: promocode.current_activations + 1 })
        .eq('id', promocode.id)

      return NextResponse.json({
        success: true,
        message: `🎉 Реферальная система активирована! Ваша комиссия: ${commission}%`,
        promoType: 'referral_access',
        promocode: {
          id: promocode.id,
          code: promocode.code,
          promoType: promocode.promo_type,
          referralCommission: commission
        }
      })
    }

    // Возвращаем данные промокода (без фиксации использования - это будет при оплате)
    return NextResponse.json({
      success: true,
      message: 'Промокод применён!',
      promoType: promocode.promo_type || 'discount',
      promocode: {
        id: promocode.id,
        code: promocode.code,
        discountPercent: promocode.discount_percent,
        discountAmount: promocode.discount_amount,
        description: promocode.description,
        promoType: promocode.promo_type || 'discount'
      }
    })

  } catch (error) {
    console.error('Error applying promocode:', error)
    return NextResponse.json(
      { error: 'Ошибка при применении промокода' },
      { status: 500 }
    )
  }
}
