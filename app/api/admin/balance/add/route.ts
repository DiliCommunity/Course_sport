import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * API для админа: начисление баланса пользователю
 * POST /api/admin/balance/add
 * 
 * Body:
 * {
 *   user_id: string (optional, если не указан - ищем по username)
 *   username: string (optional, если не указан - используем user_id)
 *   amount: number (сумма в рублях)
 *   description: string (описание транзакции)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { user_id, username, amount, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      )
    }

    const amountInKopecks = Math.round(parseFloat(amount) * 100)

    // Используем admin client для всех операций
    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Находим пользователя
    let targetUserId = user_id

    if (!targetUserId && username) {
      const { data: targetUser, error: userError } = await adminSupabase
        .from('users')
        .select('id, username, name')
        .ilike('username', username)
        .maybeSingle()

      if (userError || !targetUser) {
        return NextResponse.json(
          { error: `Пользователь с username "${username}" не найден` },
          { status: 404 }
        )
      }

      targetUserId = targetUser.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Необходимо указать user_id или username' },
        { status: 400 }
      )
    }

    // Получаем текущий баланс
    const { data: balanceData, error: balanceError } = await adminSupabase
      .from('user_balance')
      .select('balance, total_earned')
      .eq('user_id', targetUserId)
      .maybeSingle()

    const currentBalance = balanceData?.balance || 0
    const currentTotalEarned = balanceData?.total_earned || 0

    // Обновляем или создаем баланс
    if (balanceData) {
      const { error: updateError } = await adminSupabase
        .from('user_balance')
        .update({
          balance: currentBalance + amountInKopecks,
          total_earned: currentTotalEarned + amountInKopecks,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', targetUserId)

      if (updateError) {
        console.error('Ошибка обновления баланса:', updateError)
        return NextResponse.json(
          { error: 'Ошибка обновления баланса' },
          { status: 500 }
        )
      }
    } else {
      const { error: insertError } = await adminSupabase
        .from('user_balance')
        .insert({
          user_id: targetUserId,
          balance: amountInKopecks,
          total_earned: amountInKopecks,
          total_withdrawn: 0
        })

      if (insertError) {
        console.error('Ошибка создания баланса:', insertError)
        return NextResponse.json(
          { error: 'Ошибка создания баланса' },
          { status: 500 }
        )
      }
    }

    // Создаем транзакцию
    const transactionDescription = description || `Начисление баланса администратором: ${(amountInKopecks / 100).toLocaleString('ru-RU')} ₽`
    
    const { data: transaction, error: transactionError } = await adminSupabase
      .from('transactions')
      .insert({
        user_id: targetUserId,
        type: 'earned',
        amount: amountInKopecks,
        description: transactionDescription,
        reference_type: 'admin_balance_add'
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Ошибка создания транзакции:', transactionError)
      // Баланс уже обновлен, но транзакция не создана - это не критично
    }

    // Получаем информацию о пользователе для ответа
    const { data: targetUser } = await adminSupabase
      .from('users')
      .select('id, username, name')
      .eq('id', targetUserId)
      .single()

    return NextResponse.json({
      success: true,
      message: `Баланс успешно начислен пользователю ${targetUser?.username || targetUser?.name || targetUserId}`,
      user: {
        id: targetUser?.id,
        username: targetUser?.username,
        name: targetUser?.name
      },
      amount: amountInKopecks / 100,
      new_balance: (currentBalance + amountInKopecks) / 100,
      transaction: transaction
    })

  } catch (error: any) {
    console.error('Ошибка начисления баланса:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

