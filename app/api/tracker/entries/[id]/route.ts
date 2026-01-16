import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

// DELETE - удаление записи
export async function DELETE(
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

    const entryId = params.id

    // Проверяем, что запись принадлежит пользователю
    const { data: existing } = await adminSupabase
      .from('tracker_entries')
      .select('user_id')
      .eq('id', entryId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found or access denied' },
        { status: 404 }
      )
    }

    const { error } = await adminSupabase
      .from('tracker_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Error deleting tracker entry:', error)
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete tracker entry API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

