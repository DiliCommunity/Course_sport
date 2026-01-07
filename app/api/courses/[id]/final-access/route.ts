import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { getCourseUUID, COURSE_IDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Проверка доступа к финальным модулям (5-6, 25% курса)
// Доступен только после прохождения 70% модулей 2-4
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const courseId = params.id
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем enrollment
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
        message: 'Вы не записаны на этот курс'
      })
    }

    // Проверяем есть ли оплата финальных модулей
    const { data: finalModulesPayment } = await adminSupabase
      .from('payments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .filter('metadata->>type', 'eq', 'final_modules')
      .maybeSingle()

    const hasFinalModulesAccess = !!finalModulesPayment

    // Если уже куплены финальные модули - доступ есть
    if (hasFinalModulesAccess) {
      return NextResponse.json({
        hasAccess: true,
        reason: 'final_modules_purchased',
        hasFullAccess: true
      })
    }

    // Иначе проверяем прогресс модулей 2-4 (нужно 70%)
    // Для статических курсов (кето и интервальное) используем фиксированные значения
    const isKeto = courseId === '1' || courseId === COURSE_IDS.KETO
    const isInterval = courseId === '2' || courseId === COURSE_IDS.INTERVAL
    
    let modules24Total = 0
    let completedModules24 = 0
    
    if (isKeto || isInterval) {
      // Для статических курсов: модули 2-4 это статические уроки
      // Кето: 8 уроков (3 + 3 + 2)
      // IF: 7 уроков (2 + 3 + 2)
      modules24Total = isKeto ? 8 : 7
      
      // Получаем завершенные статические уроки
      const prefix = isKeto ? 'keto-m' : 'if-m'
      const { data: completedProgress } = await adminSupabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .like('lesson_id', `${prefix}%`)
      
      completedModules24 = completedProgress?.length || 0
    } else {
      // Для обычных курсов используем таблицу lessons
      const { data: allLessons } = await adminSupabase
        .from('lessons')
        .select('id, order_index, module_number')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (!allLessons || allLessons.length === 0) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'no_lessons',
          message: 'Уроки не найдены'
        })
      }

      const totalLessons = allLessons.length
      const freeModuleEnd = Math.floor(totalLessons * 0.15)
      const modules24End = Math.floor(totalLessons * 0.75)
      
      const modules24Lessons = allLessons.slice(freeModuleEnd, modules24End)
      modules24Total = modules24Lessons.length

      // Получаем завершенные уроки
      const { data: completedProgress } = await adminSupabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)

      const completedLessonIds = new Set((completedProgress || []).map(p => p.lesson_id))
      
      completedModules24 = modules24Lessons.filter(lesson => 
        completedLessonIds.has(lesson.id)
      ).length
    }
    
    const requiredLessons = Math.ceil(modules24Total * 0.7) // 70% от модулей 2-4

    const hasRequiredProgress = completedModules24 >= requiredLessons

    // Получаем цену модулей 2-4 для расчета цены финальных модулей
    // Модули 2-4 стоят 10₽ (1000 копеек), финальные модули = 30% от этой суммы
    const { data: courseData } = await adminSupabase
      .from('courses')
      .select('price')
      .eq('id', getCourseUUID(courseId))
      .maybeSingle()

    // Цена модулей 2-4 = полная цена курса (т.к. модули 2-4 стоят 10₽ за все)
    const modules24Price = courseData?.price || 1000 // 10₽ в копейках (тестовая цена)
    // Финальные модули = 30% от цены модулей 2-4
    const finalModulesPrice = Math.round(modules24Price * 0.3) // 30% от цены модулей 2-4 = 3₽ (300 копеек)

    // Доступ ТОЛЬКО после оплаты, даже если прогресс >= 70%
    return NextResponse.json({
      hasAccess: hasFinalModulesAccess, // Доступ только если оплачено
      reason: hasFinalModulesAccess 
        ? 'final_modules_purchased' 
        : hasRequiredProgress 
        ? 'progress_requirement_met' 
        : 'insufficient_progress',
      progress: {
        completed: completedModules24,
        required: requiredLessons,
        total: modules24Total,
        percent: modules24Total > 0 ? Math.round((completedModules24 / modules24Total) * 100) : 0
      },
      finalPrice: finalModulesPrice, // Цена в копейках
      canPurchase: hasRequiredProgress, // Можно купить только если прогресс >= 70%
      message: hasFinalModulesAccess
        ? 'У вас есть доступ к финальным модулям'
        : hasRequiredProgress
        ? 'Вы прошли 70% модулей 2-4, можете купить финальные модули'
        : `Нужно пройти еще ${requiredLessons - completedModules24} уроков из модулей 2-4 (сейчас ${modules24Total > 0 ? Math.round((completedModules24 / modules24Total) * 100) : 0}%)`
    })

  } catch (error: any) {
    console.error('Final access check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

