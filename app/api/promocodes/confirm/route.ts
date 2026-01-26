import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromSession } from '@/lib/auth/session'

// Фиксация использования промокода после оплаты
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    
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

    // Увеличиваем счётчик активаций
    const { error: updateError } = await supabase
      .from('promocodes')
      .update({ 
        current_activations: supabase.rpc('increment_promocode_activations', { promo_id: promocodeId })
      })
      .eq('id', promocodeId)

    // Альтернативный способ увеличения счётчика
    if (updateError) {
      await supabase.rpc('increment', { 
        table_name: 'promocodes',
        row_id: promocodeId,
        column_name: 'current_activations'
      }).catch(() => {
        // Fallback: прямой SQL
        supabase
          .from('promocodes')
          .select('current_activations')
          .eq('id', promocodeId)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('promocodes')
                .update({ current_activations: (data.current_activations || 0) + 1 })
                .eq('id', promocodeId)
            }
          })
      })
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

