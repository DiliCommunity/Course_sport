import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Profile API] Getting profile data...')
    const supabase = await createClient()

    // Получаем пользователя из сессии
    const user = await getUserFromSession(supabase)

    if (!user) {
      console.log('[Profile API] No user in session')
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Please log in to view your profile',
        },
        { status: 401 }
      )
    }

    console.log('[Profile API] User found:', user.id, user.username)

    // Получаем баланс
    const { data: balance } = await supabase
      .from('user_balance')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем записи на курсы
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Получаем реферальный код пользователя
    const { data: referralCode } = await supabase
      .from('user_referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем рефералов (кого пригласил пользователь)
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referrals_referred_id_fkey(id, name, email, phone, telegram_username, created_at)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    // Получаем статистику по рефералам
    const { data: referralStats } = await supabase
      .from('referrals')
      .select('referrer_earned, total_earned_from_purchases, status')
      .eq('referrer_id', user.id)

    // Вычисляем статистику
    const totalReferrals = referrals?.length || 0
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0
    const totalEarned = referralStats?.reduce((sum, r) => sum + (r.referrer_earned || 0) + (r.total_earned_from_purchases || 0), 0) || 0

    // Получаем транзакции
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    // Получаем названия курсов для транзакций
    const courseIds = Array.from(new Set((transactions || []).filter(t => t.reference_id).map(t => t.reference_id)))
    let coursesMap: Record<string, string> = {}
    
    if (courseIds.length > 0) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds)
      
      if (coursesData) {
        coursesMap = Object.fromEntries(coursesData.map(c => [c.id, c.title]))
      }
    }

    // Проверяем, является ли пользователь админом
    const isAdmin = user.is_admin === true || user.username === 'admini_mini'

    // Форматируем enrollments для фронтенда
    const formattedEnrollments = (enrollments || []).map(e => ({
      id: e.id,
      progress: e.progress || 0,
      completed_at: e.completed_at,
      courses: e.course || {
        id: '',
        title: '',
        image_url: '',
        price: 0,
        duration_minutes: 0,
        rating: 0,
        students_count: 0,
      }
    }))

    // Проверяем есть ли ЛЮБАЯ транзакция (для реферальной ссылки)
    // Реферальная ссылка доступна после первой оплаты
    const hasAnyTransaction = (transactions?.length || 0) > 0

    console.log('[Profile API] Data loaded:', {
      enrollments: formattedEnrollments.length,
      transactions: transactions?.length || 0,
      hasReferralCode: !!referralCode,
      referralCodeValue: referralCode?.referral_code,
      hasAnyTransaction
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        username: user.username,
        avatar_url: user.avatar_url,
        telegram_id: user.telegram_id,
        telegram_username: user.telegram_username,
        telegram_wallet_address: user.telegram_wallet_address,
        telegram_wallet_connected: user.telegram_wallet_connected,
        registration_method: user.registration_method,
        created_at: user.created_at,
        is_admin: isAdmin,
      },
      balance: {
        balance: balance?.balance || 0,
        total_earned: balance?.total_earned || 0,
        total_withdrawn: balance?.total_withdrawn || 0,
      },
      // ИСПРАВЛЕНО: было referralCode?.code, должно быть referral_code
      referralCode: referralCode?.referral_code || '',
      hasPurchasedCourse: hasAnyTransaction, // Реферальная ссылка после ЛЮБОЙ транзакции
      referrals: referrals || [],
      referralStats: {
        total_referred: totalReferrals,
        total_earned: totalEarned,
        active_referrals: activeReferrals,
        completed_referrals: referrals?.filter(r => r.status === 'completed').length || 0,
      },
      enrollments: formattedEnrollments,
      transactions: (transactions || []).map(t => {
        // Формируем читаемое описание с названием курса
        const courseName = t.reference_id ? coursesMap[t.reference_id] : null
        let description = t.description || ''
        
        // Если есть название курса и это покупка - показываем название
        if (courseName && t.reference_type === 'course_purchase') {
          description = `Оплата курса: ${courseName}`
        }
        
        return {
          id: t.id,
          created_at: t.created_at,
          type: t.type || 'spent',
          amount: t.amount || 0,
          description,
          courseName,
        }
      }),
    })
  } catch (error: any) {
    console.error('Profile data error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
