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

    // Интеграция с Groq API (бесплатный)
    const groqApiKey = process.env.GROQ_API_KEY?.trim()

    console.log('[AI Chef] API Key check:', {
      hasGroqKey: !!groqApiKey,
      keyLength: groqApiKey ? groqApiKey.length : 0
    })

    if (!groqApiKey) {
      console.error('[AI Chef] No Groq API key found')
      return NextResponse.json(
        { error: 'Groq API key not configured. Please set GROQ_API_KEY in environment variables. Получите бесплатный ключ на https://console.groq.com/' },
        { status: 500 }
      )
    }


    try {
      // Динамический импорт для избежания проблем с SSR
      let OpenAI
      try {
        OpenAI = require('openai')
      } catch (requireError) {
        console.error('[AI Chef] Error requiring openai package:', requireError)
        return NextResponse.json(
          { error: 'OpenAI package not installed. Please run: npm install openai' },
          { status: 500 }
        )
      }

      const client = new OpenAI({
        apiKey: groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
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

      // Используем актуальную модель Groq
      const model = 'llama-3.1-8b-instant'  // Актуальная быстрая модель Groq
      
      console.log('[AI Chef] Sending request to Groq with mode:', mode, 'model:', model)
      console.log('[AI Chef] API Key length:', groqApiKey?.length || 0, 'Base URL: https://api.groq.com/openai/v1')
      
      const completion = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: mode === 'recipe' ? 2000 : 1000,
        stream: false
      })

      console.log('[AI Chef] Received response from Groq')
      
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
      console.error('[AI Chef] Error details:', {
        message: llmError.message,
        status: llmError.status,
        code: llmError.code,
        type: llmError.type,
        response: llmError.response,
        stack: llmError.stack
      })
      
      // Более детальное сообщение об ошибке
      let errorMessage = 'Ошибка при обращении к Groq API'
      if (llmError.status === 401 || llmError.statusCode === 401) {
        errorMessage = 'Неверный Groq API ключ. Проверьте GROQ_API_KEY в настройках Vercel. Убедитесь, что ключ скопирован полностью без пробелов.'
      } else if (llmError.status === 429 || llmError.statusCode === 429) {
        errorMessage = 'Превышен лимит запросов Groq. Попробуйте позже.'
      } else if (llmError.code === 'model_decommissioned' || llmError.message?.includes('decommissioned')) {
        errorMessage = 'Модель устарела. Обновите код для использования актуальной модели Groq.'
      } else if (llmError.message) {
        if (llmError.message.includes('API key')) {
          errorMessage = 'Проблема с Groq API ключом. Проверьте GROQ_API_KEY в настройках Vercel.'
        } else {
          errorMessage = `Groq API error: ${llmError.message}`
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? llmError.message : undefined
        },
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

