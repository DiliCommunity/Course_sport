import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

// Фиксация использования промокода после оплаты
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createClient()
    const user = await getUserFromSession(supabaseClient)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { promocodeId, discountApplied, orderId } = body

    if (!promocodeId) {
      return NextResponse.json(
        { error: 'ID промокода не указан' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Добавляем запись об использовании
    const { error: insertError } = await supabase
      .from('user_promocodes')
      .insert({
        user_id: user.id,
        promocode_id: promocodeId,
        discount_applied: discountApplied || 0,
        order_id: orderId || null
      })

    if (insertError) {
      // Если уже использовал - это не ошибка
      if (insertError.code === '23505') { // unique violation
        return NextResponse.json({
          success: true,
          message: 'Промокод уже был использован'
        })
      }
      throw insertError
    }

    // Увеличиваем счётчик активаций - сначала получаем текущее значение
    const { data: currentPromo } = await supabase
      .from('promocodes')
      .select('current_activations')
      .eq('id', promocodeId)
      .single()

    if (currentPromo) {
      await supabase
        .from('promocodes')
        .update({ current_activations: (currentPromo.current_activations || 0) + 1 })
        .eq('id', promocodeId)
    }

    return NextResponse.json({
      success: true,
      message: 'Использование промокода зафиксировано'
    })

  } catch (error) {
    console.error('Error confirming promocode:', error)
    return NextResponse.json(
      { error: 'Ошибка при фиксации промокода' },
      { status: 500 }
    )
  }
}
