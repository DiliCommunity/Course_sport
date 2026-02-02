import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

// GET - получение списка рецептов
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

    // Получаем рецепты из БД
    const { data: recipes, error } = await adminSupabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin Recipes] Error fetching recipes:', error)
      // Если таблицы нет, возвращаем пустой массив
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json({ recipes: [] })
      }
      throw error
    }

    return NextResponse.json({
      recipes: recipes || []
    })

  } catch (error: any) {
    console.error('[Admin Recipes] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке рецептов' },
      { status: 500 }
    )
  }
}

// POST - создание нового рецепта
export async function POST(request: NextRequest) {
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
    let imageUrl: string | null = null
    const imageFile = formData.get('image') as File | null
    
    if (imageFile && imageFile.size > 0) {
      try {
        // Проверяем размер файла (макс 5 МБ)
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Размер изображения не должен превышать 5 МБ' },
            { status: 400 }
          )
        }

        // Загружаем в Supabase Storage
        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const fileExt = imageFile.name.split('.').pop() || 'jpg'
        const finalFileName = `${fileName}.${fileExt}`

        // Конвертируем File в ArrayBuffer для загрузки
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Загружаем в bucket 'recipes' (если bucket не существует, создайте его в Supabase Dashboard)
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('recipes')
          .upload(finalFileName, buffer, {
            contentType: imageFile.type || 'image/jpeg',
            upsert: false
          })

        if (uploadError) {
          console.error('[Admin Recipes] Storage upload error:', uploadError)
          // Если bucket не существует, используем base64 как fallback
          const base64 = buffer.toString('base64')
          const mimeType = imageFile.type || 'image/jpeg'
          imageUrl = `data:${mimeType};base64,${base64}`
          console.warn('[Admin Recipes] Using base64 fallback for image')
        } else if (uploadData) {
          // Получаем публичный URL
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

    // Сохраняем рецепт в БД
    const { data: newRecipe, error: insertError } = await adminSupabase
      .from('recipes')
      .insert({
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
        image_url: imageUrl,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Admin Recipes] Error creating recipe:', insertError)
      
      // Если таблицы нет, создадим её структуру в ответе
      if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Таблица recipes не найдена. Необходимо создать таблицу в Supabase.',
            hint: 'Создайте таблицу recipes с полями: id (uuid), name (text), description (text), calories (int), proteins (float), fats (float), carbs (float), prep_time (int), estimated_cost (int), cooking_method (text), dish_type (text), processing_method (text), ingredients (jsonb), instructions (jsonb), available_products (jsonb), image_url (text), created_by (uuid), created_at (timestamp)'
          },
          { status: 500 }
        )
      }
      
      throw insertError
    }

    return NextResponse.json({
      success: true,
      recipe: newRecipe
    })

  } catch (error: any) {
    console.error('[Admin Recipes] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка при создании рецепта' },
      { status: 500 }
    )
  }
}

