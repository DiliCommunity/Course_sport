import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'
import { ketoRecipesData } from '@/components/recipes/ketoRecipesData'
import { enhancedMealsDatabase } from '@/components/recipes/enhancedMealsData'
import type { Meal } from '@/components/recipes/MenuGenerator'

export const dynamic = 'force-dynamic'

/**
 * API для импорта всех рецептов из личного шефа в базу данных
 * Импортирует рецепты из ketoRecipesData и enhancedMealsDatabase
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Доступ запрещён. Только для администраторов.' },
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

    // Собираем все рецепты из разных источников
    const allRecipes: Meal[] = []

    // 1. Импортируем из ketoRecipesData
    Object.values(ketoRecipesData).forEach((categoryRecipes: Meal[]) => {
      categoryRecipes.forEach(recipe => {
        allRecipes.push(recipe)
      })
    })

    // 2. Импортируем из enhancedMealsDatabase
    Object.values(enhancedMealsDatabase).forEach((categoryRecipes: Meal[]) => {
      categoryRecipes.forEach(recipe => {
        // Проверяем, нет ли уже такого рецепта (по названию)
        const exists = allRecipes.some(r => r.name === recipe.name)
        if (!exists) {
          allRecipes.push(recipe)
        }
      })
    })

    console.log(`[Import Recipes] Found ${allRecipes.length} recipes to import`)

    // Преобразуем рецепты в формат базы данных
    const recipesToInsert = allRecipes.map(recipe => {
      // Определяем dishType на основе категории или из рецепта
      let dishType = recipe.dishType || 'second'
      
      // Если dishType не указан, пытаемся определить по названию или другим признакам
      if (!recipe.dishType) {
        const name = recipe.name?.toLowerCase() || ''
        if (name.includes('салат') || name.includes('тартар') || name.includes('закуск')) {
          dishType = 'snack'
        } else if (name.includes('суп') || name.includes('бульон')) {
          dishType = 'first'
        } else if (name.includes('десерт') || name.includes('чизкейк') || name.includes('торт') || name.includes('кекс')) {
          dishType = 'dessert'
        }
      }

      // Определяем processingMethod
      let processingMethod = recipe.processingMethod || 'baking'
      if (!recipe.processingMethod) {
        // Пытаемся определить по описанию или инструкциям
        const description = (recipe.description || '').toLowerCase()
        const instructions = (recipe.instructions || []).join(' ').toLowerCase()
        const combined = description + ' ' + instructions
        
        if (combined.includes('су-вид') || combined.includes('sous vide')) {
          processingMethod = 'sous_vide'
        } else if (combined.includes('гриль') || combined.includes('grill')) {
          processingMethod = 'grilling'
        } else if (combined.includes('жарить') || combined.includes('fry')) {
          processingMethod = 'frying'
        } else if (combined.includes('варить') || combined.includes('boil')) {
          processingMethod = 'boiling'
        } else if (combined.includes('пару') || combined.includes('steam')) {
          processingMethod = 'steaming'
        } else if (combined.includes('аэрогриль') || combined.includes('air fry')) {
          processingMethod = 'air_frying'
        }
      }

      return {
        name: recipe.name || 'Без названия',
        description: recipe.description || null,
        calories: recipe.calories || 0,
        proteins: recipe.proteins || 0,
        fats: recipe.fats || 0,
        carbs: recipe.carbs || 0,
        prep_time: recipe.prepTime || 0,
        estimated_cost: recipe.estimatedCost || 0,
        cooking_method: recipe.cookingMethod || 'hot',
        dish_type: dishType,
        processing_method: processingMethod,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        available_products: recipe.availableProducts || [],
        image_url: recipe.image || null,
        created_by: user.id
      }
    })

    console.log(`[Import Recipes] Prepared ${recipesToInsert.length} recipes for insertion`)

    // Проверяем, какие рецепты уже есть в базе (по названию)
    const { data: existingRecipes, error: fetchError } = await adminSupabase
      .from('recipes')
      .select('name')

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Import Recipes] Error fetching existing recipes:', fetchError)
      // Продолжаем импорт даже если не удалось проверить существующие
    }

    const existingNames = new Set((existingRecipes || []).map(r => r.name.toLowerCase().trim()))
    
    // Фильтруем рецепты, которые еще не импортированы
    const newRecipes = recipesToInsert.filter(recipe => {
      const normalizedName = recipe.name.toLowerCase().trim()
      return !existingNames.has(normalizedName)
    })

    console.log(`[Import Recipes] ${newRecipes.length} new recipes to insert (${recipesToInsert.length - newRecipes.length} already exist)`)

    if (newRecipes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Все рецепты уже импортированы',
        imported: 0,
        skipped: recipesToInsert.length,
        total: recipesToInsert.length
      })
    }

    // Импортируем рецепты батчами по 50 штук
    const batchSize = 50
    let imported = 0
    let errors = 0

    for (let i = 0; i < newRecipes.length; i += batchSize) {
      const batch = newRecipes.slice(i, i + batchSize)
      
      const { error: insertError } = await adminSupabase
        .from('recipes')
        .insert(batch)

      if (insertError) {
        console.error(`[Import Recipes] Error inserting batch ${i / batchSize + 1}:`, insertError)
        errors += batch.length
      } else {
        imported += batch.length
        console.log(`[Import Recipes] Imported batch ${i / batchSize + 1}: ${batch.length} recipes`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Импортировано ${imported} рецептов`,
      imported,
      skipped: recipesToInsert.length - newRecipes.length,
      errors,
      total: recipesToInsert.length
    })

  } catch (error: any) {
    console.error('[Import Recipes] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Ошибка при импорте рецептов',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

