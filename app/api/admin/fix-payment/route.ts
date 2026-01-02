import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCourseUUID } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// ЭКСТРЕННЫЙ ENDPOINT для исправления платежей через СБП
// Используется для ручной обработки платежей, которые не были обработаны webhook'ом
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { yookassa_payment_id, user_id, course_id, amount } = body

    if (!yookassa_payment_id || !user_id) {
      return NextResponse.json(
        { error: 'yookassa_payment_id и user_id обязательны' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const courseId = course_id ? getCourseUUID(course_id) : null
    const amountInKopecks = amount ? Math.round(amount * 100) : null

    console.log('🔧 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ПЛАТЕЖА:', {
      yookassa_payment_id,
      user_id,
      course_id: courseId,
      amount: amountInKopecks
    })

    // 1. Проверяем существующий платеж
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('*')
      .or(`metadata->>yookassa_payment_id.eq.${yookassa_payment_id},metadata->>yookassa_payment_id.eq."${yookassa_payment_id}"`)
      .eq('user_id', user_id)
      .limit(1)

    let paymentRecordId = null

    if (existingPayments && existingPayments.length > 0) {
      paymentRecordId = existingPayments[0].id
      console.log('✅ Платеж найден:', paymentRecordId)
      
      // Обновляем статус на completed если нужно
      if (existingPayments[0].status !== 'completed') {
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            payment_method: existingPayments[0].payment_method || 'sbp'
          })
          .eq('id', paymentRecordId)
        console.log('✅ Статус платежа обновлен на completed')
      }
    } else {
      // Создаем платеж если его нет
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert({
          user_id: user_id,
          ...(courseId && { course_id: courseId }),
          amount: amountInKopecks || 1000,
          currency: 'RUB',
          payment_method: 'sbp', // Исправляем на sbp
          status: 'completed',
          completed_at: new Date().toISOString(),
          is_full_access: false,
          metadata: {
            yookassa_payment_id: yookassa_payment_id,
            type: courseId ? 'course_purchase' : 'balance_topup',
            fixed_manually: true
          }
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Ошибка создания платежа:', createError)
        return NextResponse.json(
          { error: 'Failed to create payment', details: createError },
          { status: 500 }
        )
      }

      paymentRecordId = newPayment.id
      console.log('✅ Платеж создан:', paymentRecordId)
    }

    // 2. Создаем enrollment если это покупка курса
    if (courseId) {
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user_id)
        .eq('course_id', courseId)
        .single()

      if (!existingEnrollment) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .upsert({
            user_id: user_id,
            course_id: courseId,
            progress: 0,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,course_id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (enrollmentError) {
          console.error('❌ Ошибка создания enrollment:', enrollmentError)
        } else {
          console.log('✅ Enrollment создан:', enrollment?.id)
        }
      } else {
        console.log('✅ Enrollment уже существует:', existingEnrollment.id)
      }
    }

    // 3. Создаем транзакцию
    if (amountInKopecks) {
      const transactionType = courseId ? 'spent' : 'earned'
      const referenceType = courseId ? 'course_purchase' : 'balance_topup'
      
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user_id)
        .eq('amount', amountInKopecks)
        .eq('type', transactionType)
        .eq('reference_type', referenceType)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .limit(1)

      if (!existingTransaction || existingTransaction.length === 0) {
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user_id,
            type: transactionType,
            amount: amountInKopecks,
            description: courseId 
              ? `Оплата курса: ${courseId}`
              : 'Пополнение баланса',
            reference_type: referenceType,
            ...(courseId && { reference_id: courseId })
          })
          .select()
          .single()

        if (transactionError) {
          console.error('❌ Ошибка создания транзакции:', transactionError)
        } else {
          console.log('✅ Транзакция создана:', transaction?.id)
        }
      } else {
        console.log('✅ Транзакция уже существует:', existingTransaction[0].id)
      }
    }

    // 4. Обновляем баланс если это пополнение
    if (!courseId && amountInKopecks) {
      const { data: balance } = await supabase
        .from('user_balance')
        .select('balance, total_earned')
        .eq('user_id', user_id)
        .single()

      if (balance) {
        await supabase
          .from('user_balance')
          .update({
            balance: (balance.balance || 0) + amountInKopecks,
            total_earned: (balance.total_earned || 0) + amountInKopecks
          })
          .eq('user_id', user_id)
        console.log('✅ Баланс обновлен')
      } else {
        await supabase
          .from('user_balance')
          .insert({
            user_id: user_id,
            balance: amountInKopecks,
            total_earned: amountInKopecks,
            total_withdrawn: 0
          })
        console.log('✅ Баланс создан')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно обработан',
      payment_id: paymentRecordId
    })

  } catch (error: any) {
    console.error('Ошибка исправления платежа:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

