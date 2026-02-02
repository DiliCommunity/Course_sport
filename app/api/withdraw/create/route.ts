import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * API для создания заявки на вывод средств
 * 
 * ЛОГИКА РАБОТЫ:
 * 1. При создании заявки средства списываются с баланса пользователя (user_balance.balance)
 * 2. Для моментального вывода (is_instant = true):
 *    - Удерживается комиссия 3% (остается в системе)
 *    - Создается выплата через YooKassa API
 *    - Деньги списываются с баланса YooKassa (который формируется из поступивших платежей)
 *    - Если выплата не удалась (включая недостаток средств в YooKassa):
 *      * Средства автоматически возвращаются на баланс пользователя
 *      * Создается транзакция возврата
 *      * Заявка помечается как 'failed'
 * 3. Для обычного вывода:
 *    - Заявка создается со статусом 'pending'
 *    - Админ может обработать её вручную через админ-панель
 * 
 * ВАЖНО: Для автоматических выплат через ЮKassa нужно:
 * 1. Настроить выплаты в личном кабинете ЮKassa
 * 2. Получить разрешение на выплаты (может потребоваться верификация)
 * 3. Убедиться, что YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY настроены в .env
 * 4. Убедиться, что на счете YooKassa достаточно средств для выплат
 * 
 * ОБРАБОТКА ОШИБОК:
 * - Если в YooKassa недостаточно средств - средства возвращаются пользователю
 * - Если счет YooKassa заблокирован - средства возвращаются пользователю
 * - При любой ошибке выплаты - средства автоматически возвращаются на баланс
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
    const { amount, withdrawal_method, card_number, phone, wallet_address, is_instant } = body

    // Валидация суммы
    let amountInKopecks = Math.round(parseFloat(amount) * 100)
    if (!amountInKopecks || amountInKopecks < 50000) { // Минимум 500₽
      return NextResponse.json(
        { error: 'Минимальная сумма вывода: 500₽' },
        { status: 400 }
      )
    }

    // Для моментального вывода удерживаем комиссию 3%
    let finalAmount = amountInKopecks
    let commissionAmount = 0
    if (is_instant) {
      commissionAmount = Math.round(amountInKopecks * 0.03) // 3% комиссия
      finalAmount = amountInKopecks - commissionAmount
      
      // Проверяем, что после комиссии сумма не меньше минимума
      if (finalAmount < 50000) {
        return NextResponse.json(
          { error: 'После комиссии 3% сумма вывода будет меньше минимальной (500₽)' },
          { status: 400 }
        )
      }
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

    // Проверяем достаточность средств (для моментального вывода учитываем полную сумму до комиссии)
    const requiredAmount = is_instant ? amountInKopecks : amountInKopecks
    if (currentBalance < requiredAmount) {
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
        amount: finalAmount, // Сумма после комиссии (если моментальный)
        withdrawal_method: withdrawal_method,
        card_number: card_number || null,
        phone: phone || null,
        wallet_address: wallet_address || null,
        status: is_instant ? 'processing' : 'pending', // Если моментальный, сразу в processing
        created_at: new Date().toISOString(),
        metadata: { 
          is_instant: is_instant || false,
          original_amount: amountInKopecks, // Оригинальная сумма до комиссии
          commission_amount: commissionAmount // Комиссия
        }
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

    // Резервируем средства (уменьшаем баланс на полную сумму, включая комиссию)
    // Комиссия остается в системе, а пользователю выплачивается finalAmount
    const { error: updateError } = await supabase
      .from('user_balance')
      .update({
        balance: currentBalance - amountInKopecks, // Списываем полную сумму (включая комиссию)
        total_withdrawn: (balanceData.total_withdrawn || 0) + finalAmount // Учитываем только выплаченную сумму
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
      amount: finalAmount, // Сумма после комиссии
      description: is_instant 
        ? `Моментальный вывод средств (${withdrawal_method}), комиссия: ${(commissionAmount / 100).toFixed(2)}₽`
        : `Заявка на вывод средств (${withdrawal_method})`,
      reference_id: withdrawalRequest.id,
      reference_type: 'withdrawal_request'
    })

    // Если запрошен моментальный вывод - пытаемся сделать выплату через ЮКассу сразу
    if (is_instant) {
      console.log(`[Withdraw API] Попытка моментального вывода для заявки ${withdrawalRequest.id}`)
      
      try {
        // Импортируем необходимые переменные для работы с ЮКассой
        const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
        const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY
        const YOOKASSA_API_URL = process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3'

        if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
          throw new Error('Платежная система не настроена для выплат')
        }

        // Формируем запрос к API ЮКассы в зависимости от метода вывода
        const amountInRubles = (finalAmount / 100).toFixed(2)
        
        let payoutRequest: any

        // Определяем тип выплаты и реквизиты в зависимости от метода
        switch (withdrawal_method) {
          case 'yoomoney':
            if (!wallet_address) {
              throw new Error('Не указан номер кошелька ЮMoney')
            }
            payoutRequest = {
              amount: {
                value: amountInRubles,
                currency: 'RUB'
              },
              payout_destination_data: {
                type: 'yoo_money',
                account_number: wallet_address.replace(/\s+/g, '')
              },
              description: `Вывод заработанных средств (ID: ${withdrawalRequest.id.substring(0, 8)})`,
              metadata: {
                withdrawal_request_id: withdrawalRequest.id,
                user_id: user.id
              }
            }
            break

          case 'card':
            if (!card_number) {
              throw new Error('Не указан номер карты')
            }
            const cardNumber = card_number.replace(/\s+/g, '')
            payoutRequest = {
              amount: {
                value: amountInRubles,
                currency: 'RUB'
              },
              payout_destination_data: {
                type: 'bank_card',
                card: {
                  number: cardNumber
                }
              },
              description: `Вывод заработанных средств (ID: ${withdrawalRequest.id.substring(0, 8)})`,
              metadata: {
                withdrawal_request_id: withdrawalRequest.id,
                user_id: user.id
              }
            }
            break

          case 'sbp':
          case 'phone':
            if (!phone) {
              throw new Error('Не указан номер телефона')
            }
            const phoneNumber = phone.startsWith('+') 
              ? phone 
              : `+7${phone.replace(/\D/g, '').slice(-10)}`
            
            payoutRequest = {
              amount: {
                value: amountInRubles,
                currency: 'RUB'
              },
              payout_destination_data: {
                type: 'sbp',
                sbp_payer_id: phoneNumber
              },
              description: `Вывод заработанных средств (ID: ${withdrawalRequest.id.substring(0, 8)})`,
              metadata: {
                withdrawal_request_id: withdrawalRequest.id,
                user_id: user.id
              }
            }
            break

          default:
            throw new Error(`Неподдерживаемый метод вывода: ${withdrawal_method}`)
        }

        // Создаем выплату через API ЮКассы
        const idempotencyKey = `payout-${withdrawalRequest.id}-${Date.now()}`
        const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')

        console.log('Создание выплаты через ЮКассу:', {
          withdrawal_id: withdrawalRequest.id,
          amount: amountInRubles,
          method: withdrawal_method,
          idempotency_key: idempotencyKey
        })

        const yookassaResponse = await fetch(`${YOOKASSA_API_URL}/payouts`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Idempotence-Key': idempotencyKey
          },
          body: JSON.stringify(payoutRequest)
        })

        if (!yookassaResponse.ok) {
          const errorData = await yookassaResponse.json().catch(() => ({ description: 'Неизвестная ошибка' }))
          console.error('Ошибка создания выплаты в ЮКассе:', errorData)
          
          // Определяем тип ошибки
          let errorMessage = errorData.description || 'Ошибка создания выплаты в ЮКассе'
          const errorCode = errorData.code || ''
          
          // Специальная обработка ошибок недостатка средств
          if (errorCode === 'insufficient_funds' || 
              errorMessage.toLowerCase().includes('недостаточно') ||
              errorMessage.toLowerCase().includes('insufficient') ||
              errorMessage.toLowerCase().includes('баланс') ||
              yookassaResponse.status === 402) {
            errorMessage = 'Недостаточно средств на счете YooKassa для моментального вывода. Средства возвращены на ваш баланс. Попробуйте обычный вывод или обратитесь к администратору.'
          } else if (errorCode === 'account_blocked' || errorMessage.toLowerCase().includes('заблокирован')) {
            errorMessage = 'Счет YooKassa временно заблокирован. Средства возвращены на ваш баланс. Обратитесь к администратору.'
          } else if (errorCode === 'invalid_request' || yookassaResponse.status === 400) {
            errorMessage = `Ошибка в данных запроса: ${errorMessage}. Средства возвращены на ваш баланс.`
          }
          
          throw new Error(errorMessage)
        }

        const payoutData: any = await yookassaResponse.json()

        console.log('Выплата создана в ЮКассе:', {
          payout_id: payoutData.id,
          status: payoutData.status,
          withdrawal_id: withdrawalRequest.id
        })

        // Обновляем заявку в БД
        const updateData: any = {
          yookassa_payout_id: payoutData.id,
          status: payoutData.status === 'succeeded' ? 'completed' : 'processing',
          processed_at: new Date().toISOString()
        }

        if (payoutData.status === 'succeeded') {
          updateData.completed_at = new Date().toISOString()
        }

        await supabase
          .from('withdrawal_requests')
          .update(updateData)
          .eq('id', withdrawalRequest.id)

        return NextResponse.json({
          success: true,
          withdrawal_id: withdrawalRequest.id,
          instant: true,
          payout_id: payoutData.id,
          message: payoutData.status === 'succeeded' 
            ? `✅ Средства успешно переведены! Выплачено: ${(finalAmount / 100).toFixed(2)}₽ (комиссия 3%: ${(commissionAmount / 100).toFixed(2)}₽)`
            : `Выплата создана и обрабатывается. Сумма: ${(finalAmount / 100).toFixed(2)}₽ (комиссия 3%: ${(commissionAmount / 100).toFixed(2)}₽)`
        })

      } catch (payoutError: any) {
        console.error(`[Withdraw API] Ошибка моментальной выплаты для заявки ${withdrawalRequest.id}:`, payoutError)
        
        // ВАЖНО: Возвращаем средства на баланс пользователя
        // Это критично, так как средства уже были списаны при создании заявки
        const { error: refundError } = await supabase
          .from('user_balance')
          .update({
            balance: currentBalance, // Возвращаем полную сумму (включая комиссию)
            total_withdrawn: (balanceData.total_withdrawn || 0) // Не увеличиваем total_withdrawn
          })
          .eq('user_id', user.id)

        if (refundError) {
          console.error('[Withdraw API] КРИТИЧЕСКАЯ ОШИБКА: Не удалось вернуть средства на баланс!', refundError)
          // В этом случае нужно уведомить администратора
        } else {
          console.log(`[Withdraw API] Средства возвращены на баланс пользователя ${user.id}: ${(amountInKopecks / 100).toFixed(2)}₽`)
        }

        // Создаем транзакцию возврата средств
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'earned',
          amount: amountInKopecks, // Возвращаем полную сумму
          description: `Возврат средств: ошибка моментального вывода - ${payoutError.message || 'Неизвестная ошибка'}`,
          reference_id: withdrawalRequest.id,
          reference_type: 'withdrawal_refund'
        })

        // Помечаем заявку как failed
        await supabase
          .from('withdrawal_requests')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: payoutError.message || 'Ошибка моментальной выплаты'
          })
          .eq('id', withdrawalRequest.id)

        return NextResponse.json(
          { 
            error: payoutError.message || 'Ошибка моментального вывода средств',
            refunded: true,
            message: 'Средства возвращены на ваш баланс из-за ошибки выплаты.'
          },
          { status: 500 }
        )
      }
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

