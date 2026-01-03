import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Profile API] Getting profile data...')
    const supabase = await createClient()
    const adminSupabase = createAdminClient() // Используем admin client для обхода RLS

    if (!adminSupabase) {
      console.error('[Profile API] Admin client not available')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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

    // Получаем баланс (используем admin client для обхода RLS)
    const { data: balance } = await adminSupabase
      .from('user_balance')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Получаем записи на курсы (используем admin client для обхода RLS)
    const { data: enrollments, error: enrollmentsError } = await adminSupabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    console.log('[Profile API] Enrollments:', enrollments?.length, 'Error:', enrollmentsError)
    
    // Получаем курсы отдельно (чтобы обойти проблемы с RLS на JOIN)
    const courseIds = Array.from(new Set((enrollments || []).map(e => e.course_id).filter(Boolean)))
    let coursesMap: Record<string, any> = {}
    
    if (courseIds.length > 0) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, image_url, price, duration_minutes, rating, students_count')
        .in('id', courseIds)
      
      if (coursesData) {
        coursesMap = Object.fromEntries(coursesData.map(c => [c.id, c]))
      }
    }

    // Получаем реферальный код пользователя (используем admin client для обхода RLS)
    let { data: referralCode } = await adminSupabase
      .from('user_referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Получаем рефералов (кого пригласил пользователь) - используем admin client для обхода RLS
    const { data: referrals, error: referralsError } = await adminSupabase
      .from('referrals')
      .select(`
        *,
        referred:users!referrals_referred_id_fkey(id, name, email, phone, telegram_username, created_at)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
    
    console.log('[Profile API] Referrals loaded:', {
      count: referrals?.length || 0,
      error: referralsError,
      referrer_id: user.id
    })

    // Вычисляем статистику
    const totalReferrals = referrals?.length || 0
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0
    // Используем total_earned из balance - там уже все комиссии правильно начислены (без дублирования)
    const totalEarned = balance?.total_earned || 0

    // Получаем транзакции (используем admin client для обхода RLS)
    const { data: transactions } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    console.log('[Profile API] Transactions found:', transactions?.length || 0)
    
    // Если реферального кода нет, но есть enrollments ИЛИ транзакции (купленные курсы) - создаем код автоматически
    if (!referralCode && (enrollments && enrollments.length > 0 || transactions && transactions.length > 0)) {
      console.log('[Profile API] Нет реферального кода, но есть enrollments/transactions - создаем автоматически')
      
      const generateCode = () => {
        const prefix = 'REF-'
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = prefix
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      let newRefCode = generateCode()
      let isUnique = false
      let attempts = 0

      // Генерируем уникальный код
      while (!isUnique && attempts < 10) {
        const { data: check } = await adminSupabase
          .from('user_referral_codes')
          .select('id')
          .eq('referral_code', newRefCode)
          .maybeSingle()

        if (!check) {
          isUnique = true
        } else {
          newRefCode = generateCode()
          attempts++
        }
      }

      if (isUnique) {
        const { data: createdCode, error: insertError } = await adminSupabase
          .from('user_referral_codes')
          .insert({
            user_id: user.id,
            referral_code: newRefCode,
            is_active: true,
            total_uses: 0,
            total_earned: 0
          })
          .select()
          .single()

        if (!insertError && createdCode) {
          referralCode = createdCode
          console.log(`✅ Автоматически создан реферальный код ${newRefCode} для пользователя ${user.id}`)
        } else {
          console.error('Ошибка создания реферального кода:', insertError)
        }
      }
    }
    
    // Получаем названия курсов для транзакций
    const transactionCourseIds = Array.from(new Set((transactions || []).filter(t => t.reference_id).map(t => t.reference_id)))
    let transactionCoursesMap: Record<string, string> = {}
    
    if (transactionCourseIds.length > 0) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', transactionCourseIds)
      
      if (coursesData) {
        transactionCoursesMap = Object.fromEntries(coursesData.map(c => [c.id, c.title]))
      }
    }

    // Проверяем, является ли пользователь админом
    const isAdmin = user.is_admin === true || user.username === 'admini_mini'

    // Форматируем enrollments для фронтенда
    const formattedEnrollments = (enrollments || []).map(e => {
      const course = coursesMap[e.course_id] || {
        id: e.course_id || '',
        title: 'Курс',
        image_url: '/img/keto_course.png',
        price: 0,
        duration_minutes: 0,
        rating: 0,
        students_count: 0,
      }
      
      return {
        id: e.id,
        progress: e.progress || 0,
        completed_at: e.completed_at,
        courses: course
      }
    })

    // Проверяем есть ли ЛЮБАЯ транзакция ИЛИ купленные курсы (для реферальной ссылки)
    // Реферальная ссылка доступна после первой оплаты или если есть купленные курсы
    const hasAnyTransaction = (transactions?.length || 0) > 0
    const hasEnrollments = (enrollments?.length || 0) > 0
    const hasPurchasedCourse = hasAnyTransaction || hasEnrollments

    console.log('[Profile API] Data loaded:', {
      enrollments: formattedEnrollments.length,
      transactions: transactions?.length || 0,
      hasReferralCode: !!referralCode,
      referralCodeValue: referralCode?.referral_code,
      hasAnyTransaction,
      hasEnrollments,
      hasPurchasedCourse
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
      hasPurchasedCourse: hasPurchasedCourse, // Реферальная ссылка после ЛЮБОЙ транзакции или покупки курса
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
        const courseName = t.reference_id ? transactionCoursesMap[t.reference_id] : null
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
