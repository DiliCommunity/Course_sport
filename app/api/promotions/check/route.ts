import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PROMOTION_LIMITS = {
  'first_100': 100, // Первым 100 студентам по 1099₽
} as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promotionId = searchParams.get('id')

    if (!promotionId) {
      return NextResponse.json({ error: 'Promotion ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Для акции "первым 100 студентам"
    if (promotionId === 'first_100') {
      // Получаем количество студентов, которые уже воспользовались акцией
      const { count, error } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .eq('type', 'promotion')
        .eq('promotion_id', 'first_100')

      if (error) {
        console.error('Error counting promotion users:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      const usedSlots = count || 0
      const availableSlots = PROMOTION_LIMITS.first_100 - usedSlots
      const isAvailable = availableSlots > 0

      return NextResponse.json({
        promotionId: 'first_100',
        available: isAvailable,
        usedSlots,
        totalSlots: PROMOTION_LIMITS.first_100,
        availableSlots: Math.max(0, availableSlots),
      })
    }

    // Для акции "2 курса за 2199₽" - всегда доступна
    if (promotionId === 'two_courses') {
      return NextResponse.json({
        promotionId: 'two_courses',
        available: true,
      })
    }

    return NextResponse.json({ error: 'Unknown promotion' }, { status: 400 })
  } catch (error: any) {
    console.error('Error checking promotion:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

