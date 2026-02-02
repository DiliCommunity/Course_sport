import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

// PUT - обновление рецепта
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const formData = await request.formData()
    
    // Парсим данные формы
    const name = formData.get('name') as string
    const description = formData.get('description') as string || ''
    const calories = parseInt(formData.get('calories') as string) || 0
    const proteins = parseFloat(formData.get('proteins') as string) || 0
    const fats = parseFloat(formData.get('fats') as string) || 0
    const carbs = parseFloat(formData.get('carbs') as string) || 0
    const prepTime = parseInt(formData.get('prepTime') as string) || 0
    const estimatedCost = parseInt(formData.get('estimatedCost') as string) || 0
    const cookingMethod = formData.get('cookingMethod') as string || 'hot'
    const dishType = formData.get('dishType') as string || 'second'
    const processingMethod = formData.get('processingMethod') as string || 'baking'
    
    // Парсим массивы
    let ingredients: string[] = []
    try {
      const ingredientsStr = formData.get('ingredients') as string
      if (ingredientsStr) {
        ingredients = JSON.parse(ingredientsStr)
      }
    } catch (e) {
      console.warn('Error parsing ingredients:', e)
    }

    let instructions: string[] = []
    try {
      const instructionsStr = formData.get('instructions') as string
      if (instructionsStr) {
        instructions = JSON.parse(instructionsStr)
      }
    } catch (e) {
      console.warn('Error parsing instructions:', e)
    }

    let availableProducts: string[] = []
    try {
      const productsStr = formData.get('availableProducts') as string
      if (productsStr) {
        availableProducts = JSON.parse(productsStr)
      }
    } catch (e) {
      console.warn('Error parsing availableProducts:', e)
    }

    // Валидация
    if (!name || !calories || !proteins || !fats || !carbs || !prepTime) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }

    // Обработка изображения
    let imageUrl: string | undefined = undefined
    const imageFile = formData.get('image') as File | null
    
    if (imageFile && imageFile.size > 0) {
      try {
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Размер изображения не должен превышать 5 МБ' },
            { status: 400 }
          )
        }

        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const fileExt = imageFile.name.split('.').pop() || 'jpg'
        const finalFileName = `${fileName}.${fileExt}`

        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('recipes')
          .upload(finalFileName, buffer, {
            contentType: imageFile.type || 'image/jpeg',
            upsert: false
          })

        if (uploadError) {
          console.error('[Admin Recipes] Storage upload error:', uploadError)
          const base64 = buffer.toString('base64')
          const mimeType = imageFile.type || 'image/jpeg'
          imageUrl = `data:${mimeType};base64,${base64}`
        } else if (uploadData) {
          const { data: { publicUrl } } = adminSupabase.storage
            .from('recipes')
            .getPublicUrl(uploadData.path)
          imageUrl = publicUrl
        }
      } catch (error) {
        console.error('[Admin Recipes] Error processing image:', error)
        return NextResponse.json(
          { error: 'Ошибка обработки изображения' },
          { status: 500 }
        )
      }
    }

    // Обновляем рецепт
    const updateData: any = {
      name,
      description,
      calories,
      proteins,
      fats,
      carbs,
      prep_time: prepTime,
      estimated_cost: estimatedCost,
      cooking_method: cookingMethod,
      dish_type: dishType,
      processing_method: processingMethod,
      ingredients: ingredients.length > 0 ? ingredients : null,
      instructions: instructions.length > 0 ? instructions : null,
      available_products: availableProducts.length > 0 ? availableProducts : null,
      updated_at: new Date().toISOString()
    }

    if (imageUrl) {
      updateData.image_url = imageUrl
    }

    const { data: updatedRecipe, error: updateError } = await adminSupabase
      .from('recipes')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Admin Recipes] Error updating recipe:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      recipe: updatedRecipe
    })

  } catch (error: any) {
    console.error('[Admin Recipes] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка при обновлении рецепта' },
      { status: 500 }
    )
  }
}

// DELETE - удаление рецепта
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await adminSupabase
      .from('recipes')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('[Admin Recipes] Error deleting recipe:', error)
      throw error
    }

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    console.error('[Admin Recipes] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка при удалении рецепта' },
      { status: 500 }
    )
  }
}

