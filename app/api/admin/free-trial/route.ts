import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/free-trial - Получить настройки бесплатного доступа
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Получаем настройки
    const { data: settings, error } = await adminSupabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'free_trial_for_new_users')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Если настройки нет - возвращаем дефолтные
    const defaultSettings = {
      enabled: true,
      duration_days: 7,
      apps: ['menu-generator', 'macro-calculator', 'if-calculator', 'shopping-list', 'recipe-generator']
    }

    const currentSettings = settings?.setting_value || defaultSettings

    return NextResponse.json({
      success: true,
      settings: currentSettings
    })

  } catch (error: any) {
    console.error('Error in admin free-trial GET:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/free-trial - Сохранить настройки бесплатного доступа
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

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { enabled, duration_days, apps } = body

    // Валидация
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      )
    }

    if (typeof duration_days !== 'number' || duration_days < 1 || duration_days > 30) {
      return NextResponse.json(
        { error: 'duration_days must be a number between 1 and 30' },
        { status: 400 }
      )
    }

    if (!Array.isArray(apps)) {
      return NextResponse.json(
        { error: 'apps must be an array' },
        { status: 400 }
      )
    }

    // Сохраняем настройки
    const settingsValue = {
      enabled,
      duration_days,
      apps
    }

    const { error: upsertError } = await adminSupabase
      .from('admin_settings')
      .upsert({
        setting_key: 'free_trial_for_new_users',
        setting_value: settingsValue,
        description: 'Настройки бесплатного доступа для новых пользователей: enabled - включен ли доступ, duration_days - длительность в днях, apps - список ID приложений',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error saving settings:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: settingsValue
    })

  } catch (error: any) {
    console.error('Error in admin free-trial POST:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

