import { createClient } from '@/lib/supabase/server'

export interface User {
  id: string
  email?: string
  phone?: string
  name?: string
  avatar_url?: string | null
  telegram_id?: string | null
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) {
      return null
    }

    // Получаем профиль пользователя
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!profile) {
      return {
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone,
      }
    }

    return {
      id: authUser.id,
      email: authUser.email,
      phone: authUser.phone,
      name: profile.name,
      avatar_url: profile.avatar_url,
      telegram_id: profile.telegram_id,
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}
