import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем текущего пользователя из сессии
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем, есть ли уже реферальный код
    const { data: existingCode } = await supabase
      .from('user_referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingCode) {
      return NextResponse.json({
        success: true,
        referral_code: existingCode.referral_code,
        referral_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://course-sport.vercel.app'}/register?ref=${existingCode.referral_code}`,
        stats: {
          total_uses: existingCode.total_uses,
          total_earned: existingCode.total_earned,
        },
      })
    }

    // Генерируем новый код
    const generateCode = () => {
      const prefix = 'REF-'
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Исключаем похожие символы
      let code = prefix
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    let referralCode: string = generateCode()
    let isUnique = false

    // Генерируем уникальный код
    while (!isUnique) {
      const { data: check } = await supabase
        .from('user_referral_codes')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (!check) {
        isUnique = true
      } else {
        referralCode = generateCode()
      }
    }

    // Создаем реферальный код
    const { data: newCode, error: insertError } = await supabase
      .from('user_referral_codes')
      .insert({
        user_id: user.id,
        referral_code: referralCode,
        is_active: true,
        total_uses: 0,
        total_earned: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating referral code:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate referral code' },
        { status: 500 }
      )
    }

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://course-sport.vercel.app'}/register?ref=${referralCode}`

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      referral_link: referralLink,
      stats: {
        total_uses: 0,
        total_earned: 0,
      },
    })
  } catch (error: any) {
    console.error('Generate referral code error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
