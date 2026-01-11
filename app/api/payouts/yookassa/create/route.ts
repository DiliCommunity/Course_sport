import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY
const YOOKASSA_API_URL = process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3'

interface YooKassaPayoutRequest {
  amount: {
    value: string
    currency: string
  }
  payout_destination_data: {
    type: string
    account_number?: string
    card?: {
      number: string
    }
    sbp_payer_id?: string
  }
  description: string
  metadata?: {
    withdrawal_request_id: string
    user_id: string
  }
}

interface YooKassaPayoutResponse {
  id: string
  status: 'pending' | 'succeeded' | 'canceled'
  amount: {
    value: string
    currency: string
  }
  description: string
  created_at: string
  metadata?: {
    withdrawal_request_id?: string
    user_id?: string
  }
}

/**
 * API для создания автоматической выплаты через ЮКассу
 * POST /api/payouts/yookassa/create
 * 
 * Требует: авторизацию админа
 * 
 * Body:
 * {
 *   withdrawal_request_id: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации админа
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Проверка наличия ключей ЮКассы
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      console.error('ЮКасса не настроена: отсутствуют YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY')
      return NextResponse.json(
        { error: 'Платежная система не настроена для выплат' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { withdrawal_request_id } = body

    if (!withdrawal_request_id) {
      return NextResponse.json(
        { error: 'withdrawal_request_id обязателен' },
        { status: 400 }
      )
    }

    // Используем admin client для получения заявки
    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Получаем заявку на вывод
    const { data: withdrawal, error: fetchError } = await adminSupabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_request_id)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Заявка на вывод не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, что заявка в статусе pending
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: `Заявка уже обрабатывается. Текущий статус: ${withdrawal.status}` },
        { status: 400 }
      )
    }

    // Проверяем, что выплата еще не создана
    if (withdrawal.yookassa_payout_id) {
      return NextResponse.json(
        { error: 'Выплата уже создана' },
        { status: 400 }
      )
    }

    // Формируем запрос к API ЮКассы в зависимости от метода вывода
    const amountInRubles = (withdrawal.amount / 100).toFixed(2)
    
    let payoutRequest: YooKassaPayoutRequest

    // Определяем тип выплаты и реквизиты в зависимости от метода
    switch (withdrawal.withdrawal_method) {
      case 'yoomoney':
        if (!withdrawal.wallet_address) {
          return NextResponse.json(
            { error: 'Не указан номер кошелька ЮMoney' },
            { status: 400 }
          )
        }
        payoutRequest = {
          amount: {
            value: amountInRubles,
            currency: 'RUB'
          },
          payout_destination_data: {
            type: 'yoo_money',
            account_number: withdrawal.wallet_address.replace(/\s+/g, '') // убираем пробелы
          },
          description: `Вывод заработанных средств (ID: ${withdrawal.id.substring(0, 8)})`,
          metadata: {
            withdrawal_request_id: withdrawal.id,
            user_id: withdrawal.user_id
          }
        }
        break

      case 'card':
        if (!withdrawal.card_number) {
          return NextResponse.json(
            { error: 'Не указан номер карты' },
            { status: 400 }
          )
        }
        // Для карт нужна только последние 4 цифры, но ЮКасса принимает полный номер
        const cardNumber = withdrawal.card_number.replace(/\s+/g, '')
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
          description: `Вывод заработанных средств (ID: ${withdrawal.id.substring(0, 8)})`,
          metadata: {
            withdrawal_request_id: withdrawal.id,
            user_id: withdrawal.user_id
          }
        }
        break

      case 'sbp':
      case 'phone':
        if (!withdrawal.phone) {
          return NextResponse.json(
            { error: 'Не указан номер телефона' },
            { status: 400 }
          )
        }
        // СБП использует номер телефона
        const phoneNumber = withdrawal.phone.startsWith('+') 
          ? withdrawal.phone 
          : `+7${withdrawal.phone.replace(/\D/g, '').slice(-10)}`
        
        payoutRequest = {
          amount: {
            value: amountInRubles,
            currency: 'RUB'
          },
          payout_destination_data: {
            type: 'sbp',
            sbp_payer_id: phoneNumber
          },
          description: `Вывод заработанных средств (ID: ${withdrawal.id.substring(0, 8)})`,
          metadata: {
            withdrawal_request_id: withdrawal.id,
            user_id: withdrawal.user_id
          }
        }
        break

      default:
        return NextResponse.json(
          { error: `Неподдерживаемый метод вывода: ${withdrawal.withdrawal_method}` },
          { status: 400 }
        )
    }

    // Создаем выплату через API ЮКассы
    const idempotencyKey = `payout-${withdrawal.id}-${Date.now()}`
    const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')

    console.log('Создание выплаты через ЮКассу:', {
      withdrawal_id: withdrawal.id,
      amount: amountInRubles,
      method: withdrawal.withdrawal_method,
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
      
      // Обновляем статус заявки на failed
      await adminSupabase
        .from('withdrawal_requests')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: errorData.description || 'Ошибка создания выплаты в ЮКассе'
        })
        .eq('id', withdrawal_request_id)

      return NextResponse.json(
        { 
          error: errorData.description || 'Ошибка создания выплаты в ЮКассе',
          details: errorData
        },
        { status: yookassaResponse.status }
      )
    }

    const payoutData: YooKassaPayoutResponse = await yookassaResponse.json()

    console.log('Выплата создана в ЮКассе:', {
      payout_id: payoutData.id,
      status: payoutData.status,
      withdrawal_id: withdrawal.id
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

    const { data: updatedWithdrawal, error: updateError } = await adminSupabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', withdrawal_request_id)
      .select()
      .single()

    if (updateError) {
      console.error('Ошибка обновления заявки после создания выплаты:', updateError)
      // Выплата создана, но статус не обновлен - это можно исправить вручную
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payoutData.id,
        status: payoutData.status,
        amount: payoutData.amount,
        created_at: payoutData.created_at
      },
      withdrawal: updatedWithdrawal,
      message: payoutData.status === 'succeeded' 
        ? 'Выплата выполнена успешно' 
        : 'Выплата создана и обрабатывается'
    })

  } catch (error: any) {
    console.error('Ошибка создания выплаты через ЮКассу:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

