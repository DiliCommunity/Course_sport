import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * API для админа: обновление статуса заявки на вывод
 * PATCH /api/admin/withdrawals/[id] - обновить статус заявки
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const withdrawalId = params.id
    const body = await request.json()
    const { status, error_message } = body

    if (!status || !['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, processing, completed, failed, cancelled' },
        { status: 400 }
      )
    }

    // Используем admin client для обновления
    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Получаем текущую заявку
    const { data: withdrawal, error: fetchError } = await adminSupabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    // Если статус меняется на failed или cancelled - возвращаем средства на баланс
    if ((status === 'failed' || status === 'cancelled') && withdrawal.status !== 'failed' && withdrawal.status !== 'cancelled') {
      const { data: userBalance } = await adminSupabase
        .from('user_balance')
        .select('balance, total_withdrawn')
        .eq('user_id', withdrawal.user_id)
        .single()

      if (userBalance) {
        await adminSupabase
          .from('user_balance')
          .update({
            balance: (userBalance.balance || 0) + withdrawal.amount,
            total_withdrawn: Math.max(0, (userBalance.total_withdrawn || 0) - withdrawal.amount)
          })
          .eq('user_id', withdrawal.user_id)
      }

      // Создаем транзакцию возврата
      await adminSupabase.from('transactions').insert({
        user_id: withdrawal.user_id,
        type: 'earned',
        amount: withdrawal.amount,
        description: `Возврат средств: заявка на вывод отменена`,
        reference_id: withdrawalId,
        reference_type: 'withdrawal_refund'
      })
    }

    // Обновляем статус заявки
    const updateData: any = {
      status,
      ...(status === 'processing' && { processed_at: new Date().toISOString() }),
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(status === 'failed' && { 
        failed_at: new Date().toISOString(),
        error_message: error_message || null
      }),
      ...(error_message && { error_message })
    }

    const { data: updatedWithdrawal, error: updateError } = await adminSupabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', withdrawalId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating withdrawal:', updateError)
      return NextResponse.json(
        { error: 'Failed to update withdrawal request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal
    })

  } catch (error: any) {
    console.error('Error in admin withdrawal update API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

