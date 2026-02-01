import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * API для создания заявки на вывод средств
 * 
 * ВАЖНО: Для автоматических выплат через ЮKassa нужно:
 * 1. Настроить выплаты в личном кабинете ЮKassa
 * 2. Получить разрешение на выплаты (может потребоваться верификация)
 * 3. Использовать API выплат ЮKassa для автоматических переводов
 * 
 * Альтернатива: Ручные выплаты через личный кабинет ЮKassa
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, withdrawal_method, card_number, phone, wallet_address, instant_withdrawal } = body

    // Валидация суммы
    const amountInKopecks = Math.round(parseFloat(amount) * 100)
    if (!amountInKopecks || amountInKopecks < 50000) { // Минимум 500₽
      return NextResponse.json(
        { error: 'Минимальная сумма вывода: 500₽' },
        { status: 400 }
      )
    }

    // Получаем баланс пользователя
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balance')
      .select('balance, total_withdrawn')
      .eq('user_id', user.id)
      .single()

    if (balanceError || !balanceData) {
      return NextResponse.json(
        { error: 'Ошибка получения баланса' },
        { status: 500 }
      )
    }

    const currentBalance = balanceData.balance || 0

    // Проверяем достаточность средств
    if (currentBalance < amountInKopecks) {
      return NextResponse.json(
        { error: 'Недостаточно средств на балансе' },
        { status: 400 }
      )
    }

    // Валидация метода вывода
    if (!withdrawal_method || !['card', 'sbp', 'yoomoney', 'phone'].includes(withdrawal_method)) {
      return NextResponse.json(
        { error: 'Неверный метод вывода' },
        { status: 400 }
      )
    }

    // Валидация реквизитов в зависимости от метода
    if (withdrawal_method === 'card' && !card_number) {
      return NextResponse.json(
        { error: 'Укажите номер карты' },
        { status: 400 }
      )
    }

    if (withdrawal_method === 'phone' && !phone) {
      return NextResponse.json(
        { error: 'Укажите номер телефона' },
        { status: 400 }
      )
    }

    // Создаем заявку на вывод
    const { data: withdrawalRequest, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: amountInKopecks,
        withdrawal_method: withdrawal_method,
        card_number: card_number || null,
        phone: phone || null,
        wallet_address: wallet_address || null,
        status: 'pending', // pending -> processing -> completed/failed
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Ошибка создания заявки на вывод:', withdrawalError)
      return NextResponse.json(
        { error: 'Ошибка создания заявки на вывод' },
        { status: 500 }
      )
    }

    // Резервируем средства (уменьшаем баланс, увеличиваем total_withdrawn)
    const { error: updateError } = await supabase
      .from('user_balance')
      .update({
        balance: currentBalance - amountInKopecks,
        total_withdrawn: (balanceData.total_withdrawn || 0) + amountInKopecks
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Ошибка обновления баланса:', updateError)
      // Откатываем заявку
      await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('id', withdrawalRequest.id)
      
      return NextResponse.json(
        { error: 'Ошибка обновления баланса' },
        { status: 500 }
      )
    }

    // Создаем транзакцию
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawn',
      amount: amountInKopecks,
      description: `Заявка на вывод средств (${withdrawal_method})`,
      reference_id: withdrawalRequest.id,
      reference_type: 'withdrawal_request'
    })

    // Если запрошен моментальный вывод - помечаем заявку для автоматической обработки
    // Админ может обработать её через админ-панель, используя кнопку "Моментальный вывод"
    if (instant_withdrawal) {
      // Обновляем метаданные заявки, чтобы указать, что запрошен моментальный вывод
      await supabase
        .from('withdrawal_requests')
        .update({
          metadata: { instant_withdrawal: true }
        })
        .eq('id', withdrawalRequest.id)
    }

    return NextResponse.json({
      success: true,
      withdrawal_id: withdrawalRequest.id,
      instant: false,
      message: 'Заявка на вывод создана. Средства будут переведены в течение 1-3 рабочих дней.'
    })

  } catch (error: any) {
    console.error('Ошибка создания заявки на вывод:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

