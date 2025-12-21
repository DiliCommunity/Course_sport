import { Redis } from '@upstash/redis'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

// Инициализация Redis клиента
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Типы данных (те же, что были в kv.ts)
export interface User {
  id: string
  email?: string
  name: string
  avatar_url?: string | null
  telegram_id?: string | null
  telegram_username?: string | null
  password_hash?: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  progress: number
  completed_at: string | null
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  short_description: string
  price: number
  original_price?: number | null
  image_url: string
  category_id: string
  instructor_id: string
  duration_minutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_published: boolean
  students_count: number
  rating: number
  lessons_count: number
  created_at: string
  updated_at: string
}

export interface UserBalance {
  user_id: string
  balance: number
  total_earned: number
  total_withdrawn: number
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  status: 'pending' | 'active' | 'completed'
  earned_amount: number
  completed_at: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'earned' | 'withdrawn' | 'spent' | 'refund'
  amount: number
  description: string
  reference_id?: string | null
  reference_type?: string | null
  created_at: string
}

// Ключи для Redis
const KEYS = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email.toLowerCase()}`,
  userByTelegram: (telegramId: string) => `user:telegram:${telegramId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `sessions:user:${userId}`,
  enrollment: (id: string) => `enrollment:${id}`,
  userEnrollments: (userId: string) => `enrollments:user:${userId}`,
  course: (id: string) => `course:${id}`,
  courses: () => `courses:all`,
  userBalance: (userId: string) => `balance:user:${userId}`,
  referral: (id: string) => `referral:${id}`,
  referralsByUser: (userId: string) => `referrals:user:${userId}`,
  referralByCode: (code: string) => `referral:code:${code}`,
  transaction: (id: string) => `transaction:${id}`,
  userTransactions: (userId: string) => `transactions:user:${userId}`,
}

// ========== USER OPERATIONS ==========

export async function createUser(userData: {
  email?: string
  name: string
  password?: string
  telegram_id?: string
  telegram_username?: string
  avatar_url?: string | null
}): Promise<User> {
  const id = randomUUID()
  const now = new Date().toISOString()
  
  let password_hash: string | undefined
  if (userData.password) {
    password_hash = await bcrypt.hash(userData.password, 10)
  }

  const user: User = {
    id,
    email: userData.email,
    name: userData.name,
    avatar_url: userData.avatar_url || null,
    telegram_id: userData.telegram_id || null,
    telegram_username: userData.telegram_username || null,
    password_hash,
    created_at: now,
  }

  // Сохраняем пользователя
  await redis.set(KEYS.user(id), user)

  // Индексы для поиска
  if (userData.email) {
    await redis.set(KEYS.userByEmail(userData.email), id)
  }
  if (userData.telegram_id) {
    await redis.set(KEYS.userByTelegram(userData.telegram_id), id)
  }

  return user
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await redis.get<User>(KEYS.user(id))
  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = await redis.get<string>(KEYS.userByEmail(email.toLowerCase()))
  if (!userId) return null
  return getUserById(userId)
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const userId = await redis.get<string>(KEYS.userByTelegram(telegramId))
  if (!userId) return null
  return getUserById(userId)
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const user = await getUserById(id)
  if (!user) throw new Error('User not found')

  const updated = { ...user, ...updates }
  await redis.set(KEYS.user(id), updated)

  // Обновляем индексы если нужно
  if (updates.email && updates.email !== user.email) {
    if (user.email) {
      await redis.del(KEYS.userByEmail(user.email))
    }
    await redis.set(KEYS.userByEmail(updates.email!.toLowerCase()), id)
  }

  if (updates.telegram_id && updates.telegram_id !== user.telegram_id) {
    if (user.telegram_id) {
      await redis.del(KEYS.userByTelegram(user.telegram_id))
    }
    await redis.set(KEYS.userByTelegram(updates.telegram_id), id)
  }

  return updated
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.password_hash) return false
  return bcrypt.compare(password, user.password_hash)
}

// ========== SESSION OPERATIONS ==========

export async function createSession(userId: string, expiresInDays = 30): Promise<Session> {
  const id = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)

  const session: Session = {
    id,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }

  const ttl = expiresInDays * 24 * 60 * 60 // секунды
  await redis.set(KEYS.session(id), session, { ex: ttl })
  
  // Добавляем в список сессий пользователя
  await redis.lpush(KEYS.userSessions(userId), id)
  await redis.expire(KEYS.userSessions(userId), ttl)

  return session
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const session = await redis.get<Session>(KEYS.session(sessionId))
  if (!session) return null

  // Проверяем срок действия
  if (new Date(session.expires_at) < new Date()) {
    await deleteSession(sessionId)
    return null
  }

  return session
}

export async function deleteSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId)
  if (session) {
    await redis.del(KEYS.session(sessionId))
    await redis.lrem(KEYS.userSessions(session.user_id), 0, sessionId)
  }
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const sessionIds = await redis.lrange<string>(KEYS.userSessions(userId), 0, -1) || []
  for (const sessionId of sessionIds) {
    await redis.del(KEYS.session(sessionId))
  }
  await redis.del(KEYS.userSessions(userId))
}

// ========== ENROLLMENT OPERATIONS ==========

export async function createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
  const id = randomUUID()
  const now = new Date().toISOString()

  const enrollment: Enrollment = {
    id,
    user_id: userId,
    course_id: courseId,
    progress: 0,
    completed_at: null,
    created_at: now,
  }

  await redis.set(KEYS.enrollment(id), enrollment)
  await redis.lpush(KEYS.userEnrollments(userId), id)

  return enrollment
}

export async function getEnrollment(id: string): Promise<Enrollment | null> {
  return await redis.get<Enrollment>(KEYS.enrollment(id))
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const enrollmentIds = await redis.lrange<string>(KEYS.userEnrollments(userId), 0, -1) || []
  const enrollments = await Promise.all(
    enrollmentIds.map(id => getEnrollment(id))
  )
  return enrollments.filter((e): e is Enrollment => e !== null)
}

export async function updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment> {
  const enrollment = await getEnrollment(id)
  if (!enrollment) throw new Error('Enrollment not found')

  const updated = { ...enrollment, ...updates }
  await redis.set(KEYS.enrollment(id), updated)
  return updated
}

// ========== COURSE OPERATIONS ==========

export async function getCourse(id: string): Promise<Course | null> {
  return await redis.get<Course>(KEYS.course(id))
}

export async function getAllCourses(): Promise<Course[]> {
  const courseIds = await redis.lrange<string>(KEYS.courses(), 0, -1) || []
  const courses = await Promise.all(
    courseIds.map(id => getCourse(id))
  )
  return courses.filter((c): c is Course => c !== null)
}

// ========== BALANCE OPERATIONS ==========

export async function getUserBalance(userId: string): Promise<UserBalance> {
  const balance = await redis.get<UserBalance>(KEYS.userBalance(userId))
  if (!balance) {
    const defaultBalance: UserBalance = {
      user_id: userId,
      balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      updated_at: new Date().toISOString(),
    }
    await redis.set(KEYS.userBalance(userId), defaultBalance)
    return defaultBalance
  }
  return balance
}

export async function updateUserBalance(
  userId: string,
  updates: Partial<Omit<UserBalance, 'user_id'>>
): Promise<UserBalance> {
  const balance = await getUserBalance(userId)
  const updated: UserBalance = {
    ...balance,
    ...updates,
    updated_at: new Date().toISOString(),
  }
  await redis.set(KEYS.userBalance(userId), updated)
  return updated
}

// ========== REFERRAL OPERATIONS ==========

export async function createReferral(
  referrerId: string,
  referredId: string,
  referralCode: string
): Promise<Referral> {
  const id = randomUUID()
  const now = new Date().toISOString()

  const referral: Referral = {
    id,
    referrer_id: referrerId,
    referred_id: referredId,
    referral_code: referralCode,
    status: 'pending',
    earned_amount: 0,
    completed_at: null,
    created_at: now,
  }

  await redis.set(KEYS.referral(id), referral)
  await redis.lpush(KEYS.referralsByUser(referrerId), id)
  await redis.set(KEYS.referralByCode(referralCode), id)

  return referral
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const referralIds = await redis.lrange<string>(KEYS.referralsByUser(userId), 0, -1) || []
  const referrals = await Promise.all(
    referralIds.map(async (id) => await redis.get<Referral>(KEYS.referral(id)))
  )
  return referrals.filter((r): r is Referral => r !== null)
}

export async function getReferralByCode(code: string): Promise<Referral | null> {
  const referralId = await redis.get<string>(KEYS.referralByCode(code))
  if (!referralId) return null
  return await redis.get<Referral>(KEYS.referral(referralId))
}

// ========== TRANSACTION OPERATIONS ==========

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const id = randomUUID()
  const now = new Date().toISOString()

  const fullTransaction: Transaction = {
    ...transaction,
    id,
    created_at: now,
  }

  await redis.set(KEYS.transaction(id), fullTransaction)
  await redis.lpush(KEYS.userTransactions(transaction.user_id), id)

  return fullTransaction
}

export async function getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const transactionIds = await redis.lrange<string>(KEYS.userTransactions(userId), 0, limit - 1) || []
  const transactions = await Promise.all(
    transactionIds.map(async (id) => await redis.get<Transaction>(KEYS.transaction(id)))
  )
  return transactions.filter((t): t is Transaction => t !== null)
}
