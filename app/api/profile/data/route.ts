import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-session'
import {
  getUserBalance,
  getUserEnrollments,
  getCourse,
  getUserReferrals,
  getUserTransactions,
} from '@/lib/vercel/kv'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get balance
    const balance = await getUserBalance(user.id)

    // Get enrollments with course details
    const enrollments = await getUserEnrollments(user.id)
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await getCourse(enrollment.course_id)
        return {
          ...enrollment,
          courses: course,
        }
      })
    )

    // Get referrals
    const referrals = await getUserReferrals(user.id)

    // Generate referral code if doesn't exist
    let referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}`
    const existingReferral = referrals.find((r) => r.referral_code)
    if (existingReferral) {
      referralCode = existingReferral.referral_code
    }

    // Get transactions
    const transactions = await getUserTransactions(user.id, 50)

    // Calculate referral stats
    const referralStats = {
      total_referred: referrals.length,
      total_earned: balance.total_earned,
      active_referrals: referrals.filter((r) => r.status === 'active').length,
      completed_referrals: referrals.filter((r) => r.status === 'completed').length,
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        telegram_id: user.telegram_id,
      },
      balance: {
        balance: balance.balance,
        total_earned: balance.total_earned,
        total_withdrawn: balance.total_withdrawn,
      },
      enrollments: enrollmentsWithCourses.filter((e) => e.courses !== null),
      referralCode,
      referralStats,
      transactions,
    })
  } catch (error: any) {
    console.error('Profile data error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
