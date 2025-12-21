import { cookies } from 'next/headers'
import { getSession, createSession, deleteSession } from './turso/db'
import { getUserById, type User } from './turso/db'

const SESSION_COOKIE_NAME = 'session_id'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 дней

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) return null

  const session = await getSession(sessionId)
  if (!session) return null

  return getUserById(session.user_id)
}

export async function createUserSession(userId: string): Promise<string> {
  const session = await createSession(userId, 30)
  const cookieStore = cookies()
  
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return session.id
}

export async function deleteUserSession(): Promise<void> {
  const cookieStore = cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    await deleteSession(sessionId)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}
