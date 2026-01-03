import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { getCourseUUID } from '@/lib/constants'

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
    // Для кето: модули 2-4 это уроки примерно с 8 по 35 (28 уроков)
    // Для интервального: модули 2-4 это уроки примерно с 6 по 25 (20 уроков)
    // Упрощенно: проверяем что пройдено 70% всех уроков кроме модулей 1, 5, 6
    
    // Получаем все уроки курса
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

    // Определяем какие уроки относятся к модулям 2-4
    // Модуль 1 обычно первые 7-8 уроков (бесплатный)
    // Модули 5-6 это последние уроки
    // Модули 2-4 это всё что между
    
    // Для кето: обычно ~48 уроков
    // Модуль 1: 1-7 (7 уроков)
    // Модули 2-4: 8-40 (33 урока) - это ~69% курса
    // Модули 5-6: 41-48 (8 уроков) - это ~17% курса
    
    // Для интервального: обычно ~36 уроков
    // Модуль 1: 1-5 (5 уроков)
    // Модули 2-4: 6-28 (23 урока) - это ~64% курса
    // Модули 5-6: 29-36 (8 уроков) - это ~22% курса
    
    // Упрощенная логика: если модуль 1 это первые 20% уроков, 
    // то модули 2-4 это следующие 55%, а модули 5-6 это последние 25%
    
    const totalLessons = allLessons.length
    const freeModuleEnd = Math.floor(totalLessons * 0.15) // Первые 15% - бесплатный модуль
    const modules24End = Math.floor(totalLessons * 0.75) // 75% - конец модулей 2-4
    
    const modules24Lessons = allLessons.slice(freeModuleEnd, modules24End)
    const requiredLessons = Math.ceil(modules24Lessons.length * 0.7) // 70% от модулей 2-4

    // Получаем завершенные уроки
    const { data: completedProgress } = await adminSupabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true)

    const completedLessonIds = new Set((completedProgress || []).map(p => p.lesson_id))
    
    // Считаем сколько уроков из модулей 2-4 завершено
    const completedModules24 = modules24Lessons.filter(lesson => 
      completedLessonIds.has(lesson.id)
    ).length

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

    return NextResponse.json({
      hasAccess: hasFinalModulesAccess || hasRequiredProgress,
      reason: hasFinalModulesAccess 
        ? 'final_modules_purchased' 
        : hasRequiredProgress 
        ? 'progress_requirement_met' 
        : 'insufficient_progress',
      progress: {
        completed: completedModules24,
        required: requiredLessons,
        total: modules24Lessons.length,
        percent: Math.round((completedModules24 / modules24Lessons.length) * 100)
      },
      finalPrice: finalModulesPrice, // Цена в копейках
      message: hasFinalModulesAccess
        ? 'У вас есть доступ к финальным модулям'
        : hasRequiredProgress
        ? 'Вы прошли 70% модулей 2-4, можете купить финальные модули'
        : `Нужно пройти еще ${requiredLessons - completedModules24} уроков из модулей 2-4 (сейчас ${Math.round((completedModules24 / modules24Lessons.length) * 100)}%)`
    })

  } catch (error: any) {
    console.error('Final access check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

