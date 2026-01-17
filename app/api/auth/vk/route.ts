import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Генерация токена сессии
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Валидация VK подписи (опционально, для дополнительной безопасности)
function validateVKSignature(params: Record<string, string>, secret: string): boolean {
  try {
    const { sign, ...restParams } = params
    if (!sign) return false

    const sortedParams = Object.keys(restParams)
      .sort()
      .map(key => `${key}=${restParams[key]}`)
      .join('&')

    const calculatedSign = crypto
      .createHash('md5')
      .update(sortedParams + secret)
      .digest('hex')

    return calculatedSign === sign
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('[VK Auth] Request body:', JSON.stringify(body, null, 2))
    
    // Данные из VK
    const vkData = body.vkUser || body
    const { 
      id, 
      first_name, 
      last_name, 
      photo_200, 
      photo_100,
      domain,
      access_token 
    } = vkData as {
      id: number
      first_name: string
      last_name?: string
      photo_200?: string
      photo_100?: string
      domain?: string
      access_token?: string
    }

    console.log('[VK Auth] Parsed VK data:', { id, first_name, last_name, domain })

    if (!id || !first_name) {
      console.error('[VK Auth] Missing required fields:', { id, first_name })
      return NextResponse.json(
        { error: 'VK user data is required: id and first_name are mandatory' },
        { status: 400 }
      )
    }

    const vkId = String(id)
    const name = `${first_name} ${last_name || ''}`.trim()
    const photoUrl = photo_200 || photo_100 || null
    const username = domain || `vk_${vkId}`
    
    console.log('[VK Auth] Processing user:', { vkId, name, username })

    // Проверяем, есть ли пользователь с таким vk_id
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('vk_id', vkId)
      .single()

    console.log('[VK Auth] Existing user check:', { 
      found: !!existingUser, 
      error: findError?.code || null,
      errorMessage: findError?.message || null 
    })

    if (findError && findError.code !== 'PGRST116') {
      console.error('[VK Auth] Find user error:', findError)
    }

    let userId: string
    let isNewUser = false

    if (existingUser) {
      console.log('[VK Auth] Existing user found:', existingUser.id)
      // Пользователь существует - обновляем данные
      userId = existingUser.id
      
      // Определяем, какой аватар использовать
      let avatarToUse = existingUser.avatar_url
      
      // Если у пользователя нет аватара, используем photo_url из VK
      if (!existingUser.avatar_url || existingUser.avatar_url.trim() === '') {
        avatarToUse = photoUrl || null
      }
      
      await supabase
        .from('users')
        .update({
          name,
          avatar_url: avatarToUse,
          vk_verified: true,
          last_login: new Date().toISOString(),
        })
        .eq('id', userId)
        
      console.log('VK user logged in:', userId)
      
      // Обрабатываем реферальный код если он есть
      const referralCode = body.referralCode || body.referral_code
      
      if (referralCode) {
        try {
          const adminSupabase = createAdminClient()
          
          if (adminSupabase) {
            const { data: existingReferral } = await adminSupabase
              .from('referrals')
              .select('id, referrer_id')
              .eq('referred_id', userId)
              .maybeSingle()
            
            if (!existingReferral) {
              const { data: referralOwner } = await adminSupabase
                .from('user_referral_codes')
                .select('user_id')
                .eq('referral_code', referralCode)
                .eq('is_active', true)
                .maybeSingle()

              if (referralOwner && referralOwner.user_id !== userId) {
                const COMMISSION_PERCENT = 30.00

                const { error: referralInsertError } = await adminSupabase
                  .from('referrals')
                  .insert({
                    referrer_id: referralOwner.user_id,
                    referred_id: userId,
                    referral_code: referralCode,
                    status: 'active',
                    referred_bonus: 0,
                    referrer_earned: 0,
                    commission_percent: COMMISSION_PERCENT
                  })

                if (referralInsertError) {
                  console.error('❌ Ошибка создания записи в referrals (VK, существующий):', referralInsertError)
                } else {
                  console.log(`✅ Реферальная связь создана для существующего пользователя VK: ${referralCode}`)
                }

                // Обновляем статистику
                const { data: currentCode } = await adminSupabase
                  .from('user_referral_codes')
                  .select('total_uses')
                  .eq('referral_code', referralCode)
                  .maybeSingle()

                if (currentCode) {
                  await adminSupabase
                    .from('user_referral_codes')
                    .update({ 
                      total_uses: (currentCode.total_uses || 0) + 1
                    })
                    .eq('referral_code', referralCode)
                }
              }
            }
          }
        } catch (refError) {
          console.error('Referral processing error (VK, existing user):', refError)
        }
      }
    } else {
      // Создаём нового пользователя
      isNewUser = true
      userId = crypto.randomUUID()
      
      const userUsername = `vk_${username}_${vkId.slice(-4)}`
      
      const newUserData = {
        id: userId,
        username: userUsername,
        password_hash: 'vk_auth_only', // Специальный маркер - вход только через VK
        name,
        vk_id: vkId,
        avatar_url: photoUrl || null,
        vk_verified: true,
        registration_method: 'vk',
      }
      
      console.log('[VK Auth] Creating new user with data:', {
        id: newUserData.id,
        username: newUserData.username,
        name: newUserData.name,
        vk_id: newUserData.vk_id,
        has_avatar: !!newUserData.avatar_url
      })
      
      // Используем admin client для создания пользователя, чтобы обойти RLS политики
      // (если RLS не разрешает INSERT анонимным пользователям)
      const adminSupabase = createAdminClient()
      const clientToUse = adminSupabase || supabase
      const clientType = adminSupabase ? 'admin' : 'regular'
      
      const { data: insertedUser, error: insertError } = await clientToUse
        .from('users')
        .insert(newUserData)
        .select()
        .single()

      if (insertError) {
        console.error(`[VK Auth] Create VK user error (${clientType} client):`, {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        return NextResponse.json(
          { error: 'Failed to create user: ' + insertError.message + (insertError.hint ? ' Hint: ' + insertError.hint : '') },
          { status: 500 }
        )
      }

      console.log(`[VK Auth] ✅ New VK user created successfully (${clientType} client):`, userId, insertedUser?.username)
      
      // Обрабатываем реферальный код для нового пользователя
      const referralCode = body.referralCode || body.referral_code
      
      if (referralCode) {
        try {
          const adminSupabase = createAdminClient()
          
          if (adminSupabase) {
            const { data: referralOwner } = await adminSupabase
              .from('user_referral_codes')
              .select('user_id')
              .eq('referral_code', referralCode)
              .eq('is_active', true)
              .maybeSingle()

            if (referralOwner && referralOwner.user_id !== userId) {
              const COMMISSION_PERCENT = 30.00

              const { error: referralInsertError } = await adminSupabase
                .from('referrals')
                .insert({
                  referrer_id: referralOwner.user_id,
                  referred_id: userId,
                  referral_code: referralCode,
                  status: 'active',
                  referred_bonus: 0,
                  referrer_earned: 0,
                  commission_percent: COMMISSION_PERCENT
                })

              if (referralInsertError) {
                console.error('❌ Ошибка создания записи в referrals (VK, новый):', referralInsertError)
              } else {
                console.log(`✅ Реферальная связь создана для нового пользователя VK: ${referralCode}`)
              }

              // Обновляем статистику
              const { data: currentCode } = await adminSupabase
                .from('user_referral_codes')
                .select('total_uses')
                .eq('referral_code', referralCode)
                .maybeSingle()

              if (currentCode) {
                await adminSupabase
                  .from('user_referral_codes')
                  .update({ 
                    total_uses: (currentCode.total_uses || 0) + 1
                  })
                  .eq('referral_code', referralCode)
              }
            }
          }
        } catch (refError) {
          console.error('❌ Referral processing error (VK, new user):', refError)
        }
      }
    }

    // Создаём сессию
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Сессия на 30 дней

    // Удаляем старые сессии этого пользователя
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_type', 'vk')

    // Создаём новую сессию
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token: sessionToken,
        session_type: 'vk',
        vk_id: vkId,
        user_agent: request.headers.get('user-agent') || null,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (sessionError) {
      console.error('Create session error:', sessionError)
    }

    // Устанавливаем cookie с токеном сессии
    const cookieStore = await cookies()
    
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    })

    // Сохраняем vk_id для быстрой проверки на клиенте
    cookieStore.set('vk_id', vkId, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      userId,
      vkId,
      isNewUser,
      message: isNewUser ? 'Регистрация успешна!' : 'Вход выполнен успешно!',
    })

  } catch (error: any) {
    console.error('VK auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
