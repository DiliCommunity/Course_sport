import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

// Получение всех промокодов (только для админов)
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = await createClient()
    const user = await getUserFromSession(supabaseClient)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const { data: promocodes, error } = await supabase
      .from('promocodes')
      .select(`
        *,
        course:courses(id, title)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ promocodes })

  } catch (error) {
    console.error('Error fetching promocodes:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке промокодов' },
      { status: 500 }
    )
  }
}

// Создание нового промокода (только для админов)
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createClient()
    const user = await getUserFromSession(supabaseClient)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      code,
      discountPercent,
      discountAmount,
      maxActivations,
      description,
      courseId,
      validFrom,
      validUntil,
      isActive
    } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Код промокода обязателен' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const { data: promocode, error } = await supabase
      .from('promocodes')
      .insert({
        code: code.toUpperCase().trim(),
        discount_percent: discountPercent || 0,
        discount_amount: discountAmount || 0,
        max_activations: maxActivations || 20,
        description: description || null,
        course_id: courseId || null,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null,
        is_active: isActive !== false
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json(
          { error: 'Промокод с таким кодом уже существует' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      promocode
    })

  } catch (error) {
    console.error('Error creating promocode:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании промокода' },
      { status: 500 }
    )
  }
}

// Обновление промокода (только для админов)
export async function PATCH(request: NextRequest) {
  try {
    const supabaseClient = await createClient()
    const user = await getUserFromSession(supabaseClient)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      id,
      code,
      discountPercent,
      discountAmount,
      maxActivations,
      description,
      courseId,
      validFrom,
      validUntil,
      isActive
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID промокода обязателен' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (code !== undefined) updateData.code = code.toUpperCase().trim()
    if (discountPercent !== undefined) updateData.discount_percent = discountPercent
    if (discountAmount !== undefined) updateData.discount_amount = discountAmount
    if (maxActivations !== undefined) updateData.max_activations = maxActivations
    if (description !== undefined) updateData.description = description
    if (courseId !== undefined) updateData.course_id = courseId || null
    if (validFrom !== undefined) updateData.valid_from = validFrom
    if (validUntil !== undefined) updateData.valid_until = validUntil
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: promocode, error } = await supabase
      .from('promocodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      promocode
    })

  } catch (error) {
    console.error('Error updating promocode:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении промокода' },
      { status: 500 }
    )
  }
}

// Удаление промокода (только для админов)
export async function DELETE(request: NextRequest) {
  try {
    const supabaseClient = await createClient()
    const user = await getUserFromSession(supabaseClient)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID промокода обязателен' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const { error } = await supabase
      .from('promocodes')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Промокод удалён'
    })

  } catch (error) {
    console.error('Error deleting promocode:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении промокода' },
      { status: 500 }
    )
  }
}
