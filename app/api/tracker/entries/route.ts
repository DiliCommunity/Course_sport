import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

// GET - получение всех записей пользователя
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = adminSupabase
      .from('tracker_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching tracker entries:', error)
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      entries: entries || []
    })

  } catch (error: any) {
    console.error('Tracker entries API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - создание новой записи
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      date,
      goals,
      results,
      successes,
      calculations,
      notes,
      module_data,
      course_id
    } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже запись на эту дату для этого курса
    const { data: existing } = await adminSupabase
      .from('tracker_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date)
      .eq('course_id', course_id || '')
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Entry for this date already exists. Use PUT to update.' },
        { status: 400 }
      )
    }

    const { data: entry, error } = await adminSupabase
      .from('tracker_entries')
      .insert({
        user_id: user.id,
        course_id: course_id || null,
        date,
        goals: goals || null,
        results: results || null,
        successes: successes || null,
        calculations: calculations || null,
        notes: notes || null,
        module_data: module_data || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tracker entry:', error)
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ entry })

  } catch (error: any) {
    console.error('Create tracker entry API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - обновление существующей записи
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const {
      id,
      date,
      goals,
      results,
      successes,
      calculations,
      notes,
      module_data
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    // Проверяем, что запись принадлежит пользователю
    const { data: existing } = await adminSupabase
      .from('tracker_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Entry not found or access denied' },
        { status: 404 }
      )
    }

    const { data: entry, error } = await adminSupabase
      .from('tracker_entries')
      .update({
        date: date !== undefined ? date : existing.date,
        goals: goals !== undefined ? goals : null,
        results: results !== undefined ? results : null,
        successes: successes !== undefined ? successes : null,
        calculations: calculations !== undefined ? calculations : null,
        notes: notes !== undefined ? notes : null,
        module_data: module_data !== undefined ? module_data : {},
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tracker entry:', error)
      return NextResponse.json(
        { error: 'Failed to update entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ entry })

  } catch (error: any) {
    console.error('Update tracker entry API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

