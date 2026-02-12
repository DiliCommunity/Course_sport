import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

// Проверка доступа к модулю/уроку курса
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient() // Для обхода RLS
    
    if (!adminSupabase) {
      console.error('Admin client not available')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const moduleNumber = searchParams.get('module_number')
    const lessonId = searchParams.get('lesson_id')
    const checkPurchased = searchParams.get('check_purchased') === 'true'

    // Если проверяем только покупку любого курса (для рецептов и приложений)
    if (checkPurchased) {
      const user = await getUserFromSession(supabase)
      if (!user) {
        console.log('[Access Check] No user found in session - access denied')
        return NextResponse.json({ hasPurchased: false, isAdmin: false, hasFreeTrial: false }, { status: 200 })
      }

      console.log('[Access Check] Checking purchases for user:', user.id, 'is_admin:', user.is_admin)

      // Если админ - полный доступ ко всему
      if (user.is_admin) {
        console.log('[Access Check] User is admin - full access granted')
        return NextResponse.json({ hasPurchased: true, isAdmin: true, hasFreeTrial: false })
      }

      // Проверяем бесплатный доступ
      const { data: userData, error: userDataError } = await adminSupabase
        .from('users')
        .select('free_trial_enabled, free_trial_started_at, free_trial_apps, created_at')
        .eq('id', user.id)
        .single()

      console.log('[Access Check] User data:', { 
        userId: user.id, 
        userData, 
        error: userDataError?.message,
        hasFreeTrialEnabled: userData?.free_trial_enabled,
        freeTrialStartedAt: userData?.free_trial_started_at
      })

      let hasFreeTrial = false
      let isFreeTrialActive = false

      if (userData?.free_trial_enabled && userData?.free_trial_started_at) {
        // Получаем настройки админа
        const { data: settings, error: settingsError } = await adminSupabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'free_trial_for_new_users')
          .single()

        console.log('[Access Check] Admin settings:', { 
          settings, 
          error: settingsError?.message,
          enabled: settings?.setting_value?.enabled
        })

        const durationDays = settings?.setting_value?.duration_days || 7
        const startDate = new Date(userData.free_trial_started_at)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + durationDays)
        const now = new Date()

        hasFreeTrial = true
        isFreeTrialActive = now < endDate

        console.log('[Access Check] Free trial calculation:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          now: now.toISOString(),
          durationDays,
          isFreeTrialActive
        })
      } else {
        // Если у пользователя нет бесплатного доступа, но он новый (создан недавно) - проверяем настройки
        const userCreatedAt = userData?.created_at ? new Date(userData.created_at) : null
        const now = new Date()
        const daysSinceCreation = userCreatedAt ? Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)) : null

        console.log('[Access Check] User is new?', {
          created_at: userCreatedAt?.toISOString(),
          daysSinceCreation,
          isNewUser: daysSinceCreation !== null && daysSinceCreation <= 1
        })

        // Если пользователь создан после 10.02.2026 и настройки включены - даем доступ
        const cutoffDate = new Date('2026-02-10T00:00:00Z')
        const isEligibleForFreeTrial = userCreatedAt && userCreatedAt >= cutoffDate

        if (isEligibleForFreeTrial) {
          const { data: settings } = await adminSupabase
            .from('admin_settings')
            .select('setting_value')
            .eq('setting_key', 'free_trial_for_new_users')
            .single()

          if (settings?.setting_value?.enabled === true) {
            // Автоматически включаем бесплатный доступ для нового пользователя
            const durationDays = settings.setting_value.duration_days || 7
            const freeTrialApps = settings.setting_value.apps || []
            
            await adminSupabase
              .from('users')
              .update({
                free_trial_enabled: true,
                free_trial_started_at: userCreatedAt?.toISOString() || new Date().toISOString(),
                free_trial_apps: freeTrialApps
              })
              .eq('id', user.id)

            console.log('[Access Check] Auto-enabled free trial for user registered after 10.02.2026')

            hasFreeTrial = true
            isFreeTrialActive = true
          }
        }
      }

      // Если есть активный бесплатный доступ - даем доступ
      if (isFreeTrialActive) {
        console.log('[Access Check] User has active free trial - access granted')
        return NextResponse.json({
          hasPurchased: false,
          isAdmin: false,
          hasFreeTrial: true,
          isFreeTrialActive: true
        })
      }

      // Проверяем, есть ли хотя бы один завершенный платеж
      const { data: payments, error: paymentsError } = await adminSupabase
        .from('payments')
        .select('id, status, course_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .limit(10)

      console.log('[Access Check] Payments found:', payments?.length || 0, 'Error:', paymentsError?.message)

      // Альтернативная проверка: если пользователь записан на курс, значит он его купил
      const { data: enrollments, error: enrollmentsError } = await adminSupabase
        .from('enrollments')
        .select('id, course_id')
        .eq('user_id', user.id)
        .limit(10)

      console.log('[Access Check] Enrollments found:', enrollments?.length || 0, 'Error:', enrollmentsError?.message)

      const hasPurchased = (payments && payments.length > 0) || (enrollments && enrollments.length > 0)

      console.log('[Access Check] Final result - hasPurchased:', hasPurchased, 'hasFreeTrial:', hasFreeTrial)

      return NextResponse.json({
        hasPurchased: hasPurchased || false,
        isAdmin: false,
        hasFreeTrial: hasFreeTrial,
        isFreeTrialActive: isFreeTrialActive
      })
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      )
    }

    // Получаем текущего пользователя из сессии
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Если админ - полный доступ
    if (user.is_admin) {
      return NextResponse.json({
        hasAccess: true,
        isAdmin: true,
        reason: 'admin_access',
      })
    }

    // Проверяем, записан ли пользователь на курс (используем admin client для обхода RLS)
    const { data: enrollment } = await adminSupabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!enrollment) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'not_enrolled',
        message: 'Вы не записаны на этот курс',
      })
    }

    // Проверяем, есть ли полный доступ к курсу (is_full_access = true в payments)
    // Используем admin client для обхода RLS
    const { data: fullAccessPayment } = await adminSupabase
      .from('payments')
      .select('is_full_access')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .eq('is_full_access', true)
      .maybeSingle()

    const hasFullAccess = !!fullAccessPayment

    // Если проверяем доступ к конкретному модулю
    if (moduleNumber) {
      const moduleNum = parseInt(moduleNumber)
      
      // Модуль 1 (бесплатный) - всегда доступен
      if (moduleNum === 1) {
        return NextResponse.json({
          hasAccess: true,
          reason: 'free_module',
          hasFullAccess,
        })
      }

      // Если есть полный доступ - все модули доступны
      if (hasFullAccess) {
        return NextResponse.json({
          hasAccess: true,
          reason: 'full_access',
          hasFullAccess: true,
        })
      }

      // Для модулей 2+ проверяем, пройден ли предыдущий модуль
      // Предполагаем, что модуль 2 начинается после 7 уроков (для кето) или 5 уроков (для интервального)
      const previousModuleLessons = moduleNum === 2 ? (courseId === '1' ? 7 : 5) : (moduleNum - 1) * 10
      
      // Получаем прогресс по урокам
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('completed', true)

      const completedLessons = lessonProgress?.length || 0

      // Проверяем, пройден ли предыдущий модуль (минимум 80% уроков)
      const requiredLessons = Math.floor(previousModuleLessons * 0.8)
      
      if (completedLessons < requiredLessons) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'previous_module_not_completed',
          message: `Сначала завершите модуль ${moduleNum - 1}`,
          completedLessons,
          requiredLessons,
        })
      }
    }

    // Если проверяем доступ к конкретному уроку
    if (lessonId) {
      // Получаем информацию об уроке
      const { data: lesson } = await supabase
        .from('lessons')
        .select('order_index, is_free, course_id')
        .eq('id', lessonId)
        .single()

      if (!lesson) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'lesson_not_found',
        })
      }

      // Бесплатные уроки всегда доступны
      if (lesson.is_free) {
        return NextResponse.json({
          hasAccess: true,
          reason: 'free_lesson',
        })
      }

      // Проверяем, пройдены ли предыдущие уроки
      const { data: previousLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .lt('order_index', lesson.order_index)
        .order('order_index', { ascending: true })

      if (previousLessons && previousLessons.length > 0) {
        const { data: completedPrevious } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .in('lesson_id', previousLessons.map(l => l.id))
          .eq('completed', true)

        const completedCount = completedPrevious?.length || 0
        const requiredCount = previousLessons.length

        if (completedCount < requiredCount) {
          return NextResponse.json({
            hasAccess: false,
            reason: 'previous_lessons_not_completed',
            message: 'Сначала завершите предыдущие уроки',
            completedCount,
            requiredCount,
          })
        }
      }
    }

    return NextResponse.json({
      hasAccess: true,
      reason: 'enrolled',
      hasFullAccess,
    })
  } catch (error: any) {
    console.error('Access check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
