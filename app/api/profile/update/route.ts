import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем текущего пользователя
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Please log in to update your profile',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, phone, name } = body

    // Обновляем профиль пользователя
    const updateData: Record<string, unknown> = {}
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (name !== undefined) updateData.name = name

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedProfile,
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
