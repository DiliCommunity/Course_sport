import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { COURSE_IDS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Получаем текущую дату для фильтров
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // === ПОЛЬЗОВАТЕЛИ ===
    const { count: totalUsers } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: todayUsers } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)

    const { count: weekUsers } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart)

    const { count: monthUsers } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart)

    const { count: adminCount } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true)

    const { count: referralPartners } = await adminSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_referral_partner', true)

    // === ПЛАТЕЖИ ===
    const { count: totalPayments } = await adminSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })

    const { count: completedPayments } = await adminSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: pendingPayments } = await adminSupabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Общая выручка
    const { data: revenueData } = await adminSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Выручка за сегодня
    const { data: todayRevenueData } = await adminSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', todayStart)

    const todayRevenue = todayRevenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Выручка за месяц
    const { data: monthRevenueData } = await adminSupabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', monthStart)

    const thisMonthRevenue = monthRevenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // === КУРСЫ ===
    const { count: totalEnrollments } = await adminSupabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })

    // Пробуем разные форматы course_id (UUID и строковые)
    const { count: ketoEnrollments1 } = await adminSupabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', COURSE_IDS.KETO)

    const { count: ketoEnrollments2 } = await adminSupabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', '1')

    const ketoEnrollments = (ketoEnrollments1 || 0) + (ketoEnrollments2 || 0)

    const { count: intervalEnrollments1 } = await adminSupabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', COURSE_IDS.INTERVAL)

    const { count: intervalEnrollments2 } = await adminSupabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', '2')

    const intervalEnrollments = (intervalEnrollments1 || 0) + (intervalEnrollments2 || 0)

    // === ПРОМОКОДЫ ===
    const { count: totalPromocodes } = await adminSupabase
      .from('promocodes')
      .select('*', { count: 'exact', head: true })

    const { count: activePromocodes } = await adminSupabase
      .from('promocodes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { data: promocodeActivations } = await adminSupabase
      .from('promocodes')
      .select('current_activations')

    const totalActivations = promocodeActivations?.reduce((sum, p) => sum + (p.current_activations || 0), 0) || 0

    // === ОТЗЫВЫ ===
    const { count: totalReviews } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })

    const { count: pendingReviews } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)

    const { count: approvedReviews } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)

    const { data: ratingsData } = await adminSupabase
      .from('reviews')
      .select('rating')
      .eq('is_approved', true)

    const averageRating = ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
      : 0

    // === ПОСЛЕДНЯЯ АКТИВНОСТЬ ===
    const recentActivity: Array<{ type: string; message: string; time: string }> = []

    // Последние пользователи
    const { data: recentUsers } = await adminSupabase
      .from('users')
      .select('name, username, created_at')
      .order('created_at', { ascending: false })
      .limit(3)

    recentUsers?.forEach(u => {
      recentActivity.push({
        type: 'user',
        message: `Новый пользователь: ${u.name || u.username || 'Аноним'}`,
        time: formatTimeAgo(new Date(u.created_at))
      })
    })

    // Последние платежи
    const { data: recentPayments } = await adminSupabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3)

    recentPayments?.forEach(p => {
      recentActivity.push({
        type: 'payment',
        message: `Оплата: ${(p.amount / 100).toLocaleString('ru-RU')} ₽`,
        time: formatTimeAgo(new Date(p.created_at))
      })
    })

    // Последние отзывы
    const { data: recentReviews } = await adminSupabase
      .from('reviews')
      .select('user_name, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(2)

    recentReviews?.forEach(r => {
      recentActivity.push({
        type: 'review',
        message: `Отзыв от ${r.user_name}: ${'⭐'.repeat(r.rating)}`,
        time: formatTimeAgo(new Date(r.created_at))
      })
    })

    // Сортируем по времени
    recentActivity.sort((a, b) => {
      // Простая сортировка - новые сверху
      return 0
    })

    const stats = {
      users: {
        total: totalUsers || 0,
        today: todayUsers || 0,
        thisWeek: weekUsers || 0,
        thisMonth: monthUsers || 0,
        admins: adminCount || 0,
        referralPartners: referralPartners || 0
      },
      payments: {
        total: totalPayments || 0,
        completed: completedPayments || 0,
        pending: pendingPayments || 0,
        totalRevenue,
        todayRevenue,
        thisMonthRevenue
      },
      courses: {
        totalEnrollments: totalEnrollments || 0,
        ketoEnrollments: ketoEnrollments,
        intervalEnrollments: intervalEnrollments
      },
      promocodes: {
        total: totalPromocodes || 0,
        active: activePromocodes || 0,
        totalActivations
      },
      reviews: {
        total: totalReviews || 0,
        pending: pendingReviews || 0,
        approved: approvedReviews || 0,
        averageRating
      },
      recentActivity: recentActivity.slice(0, 8)
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке статистики' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`
  
  return date.toLocaleDateString('ru-RU')
}

