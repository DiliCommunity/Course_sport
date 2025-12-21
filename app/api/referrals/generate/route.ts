import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем текущего пользователя
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Генерируем реферальный код
    const referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Проверяем, есть ли уже реферальный код у пользователя
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', user.id)
      .limit(1)
      .single()

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        referral_code: existingReferral.referral_code,
      })
    }

    // Создаем реферальный код (без referred_id, так как это код для приглашения)
    // В реальном приложении можно создать отдельную таблицу для реферальных кодов
    // или использовать существующую логику

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      referral_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?ref=${referralCode}`,
    })
  } catch (error: any) {
    console.error('Generate referral error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
