import { NextRequest, NextResponse } from 'next/server'
import { deleteUserSession } from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  try {
    await deleteUserSession()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
