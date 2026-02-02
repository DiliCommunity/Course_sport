import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromSession } from '@/lib/session-utils'

export const dynamic = 'force-dynamic'

const AI_CHEF_PROMPT = `Ты AI-шеф - профессиональный помощник для администратора сайта CourseHealth. Твоя задача - помогать создавать качественные рецепты и генерировать промпты для изображений блюд.

Твоя специализация:
- Создание детальных рецептов с полной информацией (название, описание, ингредиенты, инструкции, КБЖУ, время приготовления)
- Генерация промптов для создания изображений блюд (детальные, визуальные описания)
- Помощь в формулировке описаний блюд
- Предложения по улучшению рецептов

Формат ответов:
1. Для генерации рецепта - возвращай JSON с полной структурой:
{
  "name": "Название блюда",
  "description": "Подробное описание блюда",
  "ingredients": ["ингредиент 1", "ингредиент 2", ...],
  "instructions": ["шаг 1", "шаг 2", ...],
  "calories": число,
  "proteins": число,
  "fats": число,
  "carbs": число,
  "prepTime": число (в минутах),
  "cookingMethod": "hot" или "cold",
  "dishType": "snack" | "first" | "second" | "dessert",
  "processingMethod": "sous_vide" | "grilling" | "frying" | "baking" | "boiling" | "steaming" | "air_frying"
}

2. Для генерации промпта изображения - возвращай текст с детальным визуальным описанием:
"Детальное описание блюда для генерации изображения: [описание]"

3. Для обычных вопросов - отвечай текстом с полезными советами.

ВАЖНО:
- Всегда используй реалистичные значения КБЖУ
- Инструкции должны быть пошаговыми и понятными
- Промпты для изображений должны быть детальными и визуальными
- Отвечай на русском языке
- Будь креативным, но практичным`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserFromSession(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!user.is_admin) {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      )
    }

    const { message, conversationHistory, mode } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Интеграция с DeepSeek API
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    const apiKey = deepseekApiKey || openaiApiKey
    const useDeepSeek = !!deepseekApiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY in environment variables.' },
        { status: 500 }
      )
    }

    try {
      const OpenAI = require('openai')
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: useDeepSeek 
          ? 'https://api.deepseek.com' 
          : undefined,
      })

      // Добавляем режим работы в промпт
      let finalPrompt = AI_CHEF_PROMPT
      if (mode === 'recipe') {
        finalPrompt += '\n\nРЕЖИМ: Генерация рецепта. Верни ТОЛЬКО валидный JSON без дополнительного текста.'
      } else if (mode === 'image_prompt') {
        finalPrompt += '\n\nРЕЖИМ: Генерация промпта для изображения. Верни ТОЛЬКО текст с детальным визуальным описанием блюда.'
      }

      const messages = [
        { role: 'system', content: finalPrompt },
        ...(conversationHistory || []).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ]

      const completion = await client.chat.completions.create({
        model: useDeepSeek 
          ? 'deepseek-chat'
          : 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: mode === 'recipe' ? 1500 : 500,
      })

      const response = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ.'

      // Пытаемся распарсить JSON, если режим - генерация рецепта
      if (mode === 'recipe') {
        try {
          // Убираем markdown код блоки, если есть
          const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const recipeData = JSON.parse(cleanedResponse)
          return NextResponse.json({ 
            response: 'Рецепт успешно сгенерирован!',
            recipe: recipeData,
            rawResponse: response
          })
        } catch (parseError) {
          // Если не удалось распарсить, возвращаем как есть
          return NextResponse.json({ 
            response: response,
            error: 'Не удалось распарсить рецепт. Проверьте формат ответа.',
            rawResponse: response
          })
        }
      }

      return NextResponse.json({ 
        response: response,
        rawResponse: response
      })
    } catch (llmError: any) {
      console.error('[AI Chef] LLM error:', llmError)
      return NextResponse.json(
        { error: `AI error: ${llmError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('AI Chef API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

