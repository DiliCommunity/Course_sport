import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * Проверка бесплатного доступа пользователя
 * GET /api/access/free-trial
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const user = await getUserFromSession(supabase)
    if (!user) {
      return NextResponse.json({
        hasFreeTrial: false,
        isActive: false,
        daysRemaining: 0
      })
    }

    // Получаем информацию о бесплатном доступе пользователя
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('free_trial_enabled, free_trial_started_at, free_trial_apps, created_at')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        hasFreeTrial: false,
        isActive: false,
        daysRemaining: 0
      })
    }

    // Если бесплатный доступ не включен
    if (!userData.free_trial_enabled || !userData.free_trial_started_at) {
      return NextResponse.json({
        hasFreeTrial: false,
        isActive: false,
        daysRemaining: 0,
        apps: []
      })
    }

    // Получаем настройки админа для длительности бесплатного доступа
    const { data: settings } = await adminSupabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'free_trial_for_new_users')
      .single()

    const durationDays = settings?.setting_value?.duration_days || 7
    const defaultApps = settings?.setting_value?.apps || []

    // Используем apps из настроек админа или из данных пользователя
    const trialApps = (userData.free_trial_apps && Array.isArray(userData.free_trial_apps) && userData.free_trial_apps.length > 0)
      ? userData.free_trial_apps
      : defaultApps

    // Вычисляем, истек ли бесплатный доступ
    const startDate = new Date(userData.free_trial_started_at)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + durationDays)
    const now = new Date()

    const isActive = now < endDate
    const daysRemaining = isActive 
      ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    return NextResponse.json({
      hasFreeTrial: true,
      isActive,
      daysRemaining,
      apps: trialApps,
      startedAt: userData.free_trial_started_at,
      expiresAt: endDate.toISOString()
    })

  } catch (error: any) {
    console.error('Free trial check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

