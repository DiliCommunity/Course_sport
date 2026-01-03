import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { COURSE_IDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Возвращает уроки модулей 2-4 для страницы /learn
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const courseId = params.id
    const courseUUID = courseId === '1' ? COURSE_IDS.KETO : courseId === '2' ? COURSE_IDS.INTERVAL : courseId

    // Получаем все уроки курса из БД
    const { data: allLessons, error: lessonsError } = await adminSupabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseUUID)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
    }

    // Если уроков нет в БД, возвращаем пустой массив (будет использоваться статический контент)
    if (!allLessons || allLessons.length === 0) {
      return NextResponse.json({
        lessons: [],
        modules: []
      })
    }

    // Определяем границы модулей по order_index
    const totalLessons = allLessons.length
    const module1End = Math.floor(totalLessons * 0.15) // 15% - конец модуля 1
    const modules24End = Math.floor(totalLessons * 0.85) // 85% - конец модулей 2-4
    
    // Берем только модули 2-4
    const modules24Lessons = allLessons.slice(module1End, modules24End)
    
    // Распределяем на модули 2, 3, 4
    const module2End = module1End + Math.floor((modules24End - module1End) / 3)
    const module3End = module1End + Math.floor(((modules24End - module1End) / 3) * 2)
    
    const module2Lessons = modules24Lessons.slice(0, module2End - module1End).map((lesson, idx) => ({
      ...lesson,
      module_number: 2,
      order_in_module: idx + 1
    }))
    
    const module3Lessons = modules24Lessons.slice(module2End - module1End, module3End - module1End).map((lesson, idx) => ({
      ...lesson,
      module_number: 3,
      order_in_module: idx + 1
    }))
    
    const module4Lessons = modules24Lessons.slice(module3End - module1End).map((lesson, idx) => ({
      ...lesson,
      module_number: 4,
      order_in_module: idx + 1
    }))

    const allModules24Lessons = [...module2Lessons, ...module3Lessons, ...module4Lessons]

    return NextResponse.json({
      lessons: allModules24Lessons,
      modules: [
        {
          id: 2,
          title: 'Модуль 2',
          lessons: module2Lessons
        },
        {
          id: 3,
          title: 'Модуль 3',
          lessons: module3Lessons
        },
        {
          id: 4,
          title: 'Модуль 4',
          lessons: module4Lessons
        }
      ]
    })

  } catch (error: any) {
    console.error('Lessons modules24 API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

