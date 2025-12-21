import { createClient } from '@libsql/client'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

// Инициализация Turso клиента
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

// Типы данных
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

  await client.execute({
    sql: `INSERT INTO users (id, email, name, avatar_url, telegram_id, telegram_username, password_hash, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      userData.email || null,
      userData.name,
      userData.avatar_url || null,
      userData.telegram_id || null,
      userData.telegram_username || null,
      password_hash || null,
      now,
    ],
  })

  return {
    id,
    email: userData.email,
    name: userData.name,
    avatar_url: userData.avatar_url || null,
    telegram_id: userData.telegram_id || null,
    telegram_username: userData.telegram_username || null,
    password_hash,
    created_at: now,
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as string,
    email: row.email as string | undefined,
    name: row.name as string,
    avatar_url: (row.avatar_url as string) || null,
    telegram_id: (row.telegram_id as string) || null,
    telegram_username: (row.telegram_username as string) || null,
    password_hash: row.password_hash as string | undefined,
    created_at: row.created_at as string,
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email.toLowerCase()],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as string,
    email: row.email as string | undefined,
    name: row.name as string,
    avatar_url: (row.avatar_url as string) || null,
    telegram_id: (row.telegram_id as string) || null,
    telegram_username: (row.telegram_username as string) || null,
    password_hash: row.password_hash as string | undefined,
    created_at: row.created_at as string,
  }
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE telegram_id = ?',
    args: [telegramId],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as string,
    email: row.email as string | undefined,
    name: row.name as string,
    avatar_url: (row.avatar_url as string) || null,
    telegram_id: (row.telegram_id as string) || null,
    telegram_username: (row.telegram_username as string) || null,
    password_hash: row.password_hash as string | undefined,
    created_at: row.created_at as string,
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const user = await getUserById(id)
  if (!user) throw new Error('User not found')

  if (updates.name !== undefined) {
    await client.execute({
      sql: 'UPDATE users SET name = ? WHERE id = ?',
      args: [updates.name, id],
    })
  }
  if (updates.email !== undefined) {
    await client.execute({
      sql: 'UPDATE users SET email = ? WHERE id = ?',
      args: [updates.email, id],
    })
  }
  if (updates.avatar_url !== undefined) {
    await client.execute({
      sql: 'UPDATE users SET avatar_url = ? WHERE id = ?',
      args: [updates.avatar_url, id],
    })
  }
  if (updates.telegram_username !== undefined) {
    await client.execute({
      sql: 'UPDATE users SET telegram_username = ? WHERE id = ?',
      args: [updates.telegram_username, id],
    })
  }

  return (await getUserById(id))!
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

  await client.execute({
    sql: 'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    args: [id, userId, now.toISOString(), expiresAt.toISOString()],
  })

  return {
    id,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")',
    args: [sessionId],
  })
  
  if (result.rows.length === 0) {
    await client.execute({
      sql: 'DELETE FROM sessions WHERE id = ?',
      args: [sessionId],
    })
    return null
  }
  
  const row = result.rows[0]
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    created_at: row.created_at as string,
    expires_at: row.expires_at as string,
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await client.execute({
    sql: 'DELETE FROM sessions WHERE id = ?',
    args: [sessionId],
  })
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await client.execute({
    sql: 'DELETE FROM sessions WHERE user_id = ?',
    args: [userId],
  })
}

// ========== ENROLLMENT OPERATIONS ==========

export async function createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
  const id = randomUUID()
  const now = new Date().toISOString()

  // Проверяем, существует ли уже запись
  const existing = await client.execute({
    sql: 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
    args: [userId, courseId],
  })
  
  if (existing.rows.length > 0) {
    return (await getEnrollment(existing.rows[0].id as string))!
  }
  
  await client.execute({
    sql: 'INSERT INTO enrollments (id, user_id, course_id, progress, completed_at, created_at) VALUES (?, ?, ?, 0, NULL, ?)',
    args: [id, userId, courseId, now],
  })

  return {
    id,
    user_id: userId,
    course_id: courseId,
    progress: 0,
    completed_at: null,
    created_at: now,
  }
}

export async function getEnrollment(id: string): Promise<Enrollment | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM enrollments WHERE id = ?',
    args: [id],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    course_id: row.course_id as string,
    progress: row.progress as number,
    completed_at: (row.completed_at as string) || null,
    created_at: row.created_at as string,
  }
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  })
  return result.rows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    course_id: row.course_id as string,
    progress: row.progress as number,
    completed_at: (row.completed_at as string) || null,
    created_at: row.created_at as string,
  }))
}

export async function updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment> {
  const enrollment = await getEnrollment(id)
  if (!enrollment) throw new Error('Enrollment not found')

  if (updates.progress !== undefined) {
    await client.execute({
      sql: 'UPDATE enrollments SET progress = ? WHERE id = ?',
      args: [updates.progress, id],
    })
  }
  if (updates.completed_at !== undefined) {
    await client.execute({
      sql: 'UPDATE enrollments SET completed_at = ? WHERE id = ?',
      args: [updates.completed_at, id],
    })
  }

  return (await getEnrollment(id))!
}

// ========== COURSE OPERATIONS ==========

export async function getCourse(id: string): Promise<Course | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM courses WHERE id = ? AND is_published = 1',
    args: [id],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    short_description: row.short_description as string,
    price: row.price as number,
    original_price: (row.original_price as number) || null,
    image_url: row.image_url as string,
    category_id: row.category_id as string,
    instructor_id: row.instructor_id as string,
    duration_minutes: row.duration_minutes as number,
    difficulty: row.difficulty as 'beginner' | 'intermediate' | 'advanced',
    is_published: (row.is_published as number) === 1,
    students_count: row.students_count as number,
    rating: row.rating as number,
    lessons_count: row.lessons_count as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export async function getAllCourses(): Promise<Course[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM courses WHERE is_published = 1 ORDER BY created_at DESC',
  })
  return result.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    short_description: row.short_description as string,
    price: row.price as number,
    original_price: (row.original_price as number) || null,
    image_url: row.image_url as string,
    category_id: row.category_id as string,
    instructor_id: row.instructor_id as string,
    duration_minutes: row.duration_minutes as number,
    difficulty: row.difficulty as 'beginner' | 'intermediate' | 'advanced',
    is_published: (row.is_published as number) === 1,
    students_count: row.students_count as number,
    rating: row.rating as number,
    lessons_count: row.lessons_count as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))
}

// ========== BALANCE OPERATIONS ==========

export async function getUserBalance(userId: string): Promise<UserBalance> {
  const result = await client.execute({
    sql: 'SELECT * FROM user_balance WHERE user_id = ?',
    args: [userId],
  })
  
  if (result.rows.length === 0) {
    const id = randomUUID()
    await client.execute({
      sql: 'INSERT INTO user_balance (id, user_id, balance, total_earned, total_withdrawn, updated_at) VALUES (?, ?, 0, 0, 0, datetime("now"))',
      args: [id, userId],
    })
    return {
      user_id: userId,
      balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      updated_at: new Date().toISOString(),
    }
  }
  
  const row = result.rows[0]
  return {
    user_id: row.user_id as string,
    balance: row.balance as number,
    total_earned: row.total_earned as number,
    total_withdrawn: row.total_withdrawn as number,
    updated_at: row.updated_at as string,
  }
}

export async function updateUserBalance(
  userId: string,
  updates: Partial<Omit<UserBalance, 'user_id'>>
): Promise<UserBalance> {
  const balance = await getUserBalance(userId)
  
  await client.execute({
    sql: 'UPDATE user_balance SET balance = ?, total_earned = ?, total_withdrawn = ?, updated_at = datetime("now") WHERE user_id = ?',
    args: [
      updates.balance ?? balance.balance,
      updates.total_earned ?? balance.total_earned,
      updates.total_withdrawn ?? balance.total_withdrawn,
      userId,
    ],
  })
  
  return (await getUserBalance(userId))!
}

// ========== REFERRAL OPERATIONS ==========

export async function createReferral(
  referrerId: string,
  referredId: string,
  referralCode: string
): Promise<Referral> {
  const id = randomUUID()
  const now = new Date().toISOString()

  await client.execute({
    sql: 'INSERT INTO referrals (id, referrer_id, referred_id, referral_code, status, earned_amount, completed_at, created_at) VALUES (?, ?, ?, ?, ?, 0, NULL, ?)',
    args: [id, referrerId, referredId, referralCode, 'pending', now],
  })

  return {
    id,
    referrer_id: referrerId,
    referred_id: referredId,
    referral_code: referralCode,
    status: 'pending',
    earned_amount: 0,
    completed_at: null,
    created_at: now,
  }
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM referrals WHERE referrer_id = ? ORDER BY created_at DESC',
    args: [userId],
  })
  return result.rows.map((row) => ({
    id: row.id as string,
    referrer_id: row.referrer_id as string,
    referred_id: row.referred_id as string,
    referral_code: row.referral_code as string,
    status: row.status as 'pending' | 'active' | 'completed',
    earned_amount: row.earned_amount as number,
    completed_at: (row.completed_at as string) || null,
    created_at: row.created_at as string,
  }))
}

export async function getReferralByCode(code: string): Promise<Referral | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM referrals WHERE referral_code = ?',
    args: [code],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as string,
    referrer_id: row.referrer_id as string,
    referred_id: row.referred_id as string,
    referral_code: row.referral_code as string,
    status: row.status as 'pending' | 'active' | 'completed',
    earned_amount: row.earned_amount as number,
    completed_at: (row.completed_at as string) || null,
    created_at: row.created_at as string,
  }
}

// ========== TRANSACTION OPERATIONS ==========

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const id = randomUUID()
  const now = new Date().toISOString()

  await client.execute({
    sql: 'INSERT INTO transactions (id, user_id, type, amount, description, reference_id, reference_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      id,
      transaction.user_id,
      transaction.type,
      transaction.amount,
      transaction.description,
      transaction.reference_id || null,
      transaction.reference_type || null,
      now,
    ],
  })

  return {
    ...transaction,
    id,
    created_at: now,
  }
}

export async function getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    args: [userId, limit],
  })
  return result.rows.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as 'earned' | 'withdrawn' | 'spent' | 'refund',
    amount: row.amount as number,
    description: row.description as string,
    reference_id: (row.reference_id as string) || null,
    reference_type: (row.reference_type as string) || null,
    created_at: row.created_at as string,
  }))
}
