import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

// Инициализация Neon клиента
// STORAGE_URL будет автоматически добавлен Vercel после подключения Neon к проекту
const sql = neon(process.env.STORAGE_URL || process.env.POSTGRES_URL || '')

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

  await sql`
    INSERT INTO users (id, email, name, avatar_url, telegram_id, telegram_username, password_hash, created_at)
    VALUES (${id}, ${userData.email || null}, ${userData.name}, ${userData.avatar_url || null}, 
            ${userData.telegram_id || null}, ${userData.telegram_username || null}, 
            ${password_hash || null}, ${now})
  `

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
  const result = await sql<User[]>`
    SELECT * FROM users WHERE id = ${id}
  `
  return result[0] || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql<User[]>`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `
  return result[0] || null
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const result = await sql<User[]>`
    SELECT * FROM users WHERE telegram_id = ${telegramId}
  `
  return result[0] || null
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const user = await getUserById(id)
  if (!user) throw new Error('User not found')

  if (updates.name !== undefined) {
    await sql`UPDATE users SET name = ${updates.name} WHERE id = ${id}`
  }
  if (updates.email !== undefined) {
    await sql`UPDATE users SET email = ${updates.email} WHERE id = ${id}`
  }
  if (updates.avatar_url !== undefined) {
    await sql`UPDATE users SET avatar_url = ${updates.avatar_url} WHERE id = ${id}`
  }
  if (updates.telegram_username !== undefined) {
    await sql`UPDATE users SET telegram_username = ${updates.telegram_username} WHERE id = ${id}`
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

  await sql`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (${id}, ${userId}, ${now.toISOString()}, ${expiresAt.toISOString()})
  `

  return {
    id,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await sql<Session[]>`
    SELECT * FROM sessions 
    WHERE id = ${sessionId} AND expires_at > NOW()
  `
  
  if (result.length === 0) {
    // Удаляем истекшие сессии
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    return null
  }
  
  return result[0]
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`
}

// ========== ENROLLMENT OPERATIONS ==========

export async function createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
  const id = randomUUID()
  const now = new Date().toISOString()

  await sql`
    INSERT INTO enrollments (id, user_id, course_id, progress, completed_at, created_at)
    VALUES (${id}, ${userId}, ${courseId}, 0, NULL, ${now})
    ON CONFLICT (user_id, course_id) DO NOTHING
  `

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
  const result = await sql<Enrollment[]>`
    SELECT * FROM enrollments WHERE id = ${id}
  `
  return result[0] || null
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const result = await sql<Enrollment[]>`
    SELECT * FROM enrollments WHERE user_id = ${userId} ORDER BY created_at DESC
  `
  return result
}

export async function updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment> {
  const enrollment = await getEnrollment(id)
  if (!enrollment) throw new Error('Enrollment not found')

  if (updates.progress !== undefined) {
    await sql`
      UPDATE enrollments 
      SET progress = ${updates.progress}
      WHERE id = ${id}
    `
  }
  if (updates.completed_at !== undefined) {
    await sql`
      UPDATE enrollments 
      SET completed_at = ${updates.completed_at}
      WHERE id = ${id}
    `
  }

  return (await getEnrollment(id))!
}

// ========== COURSE OPERATIONS ==========

export async function getCourse(id: string): Promise<Course | null> {
  const result = await sql<Course[]>`
    SELECT * FROM courses WHERE id = ${id} AND is_published = true
  `
  return result[0] || null
}

export async function getAllCourses(): Promise<Course[]> {
  const result = await sql<Course[]>`
    SELECT * FROM courses WHERE is_published = true ORDER BY created_at DESC
  `
  return result
}

// ========== BALANCE OPERATIONS ==========

export async function getUserBalance(userId: string): Promise<UserBalance> {
  const result = await sql<UserBalance[]>`
    SELECT * FROM user_balance WHERE user_id = ${userId}
  `
  
  if (result.length === 0) {
    // Создаем баланс если его нет
    await sql`
      INSERT INTO user_balance (user_id, balance, total_earned, total_withdrawn, updated_at)
      VALUES (${userId}, 0, 0, 0, NOW())
    `
    return {
      user_id: userId,
      balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      updated_at: new Date().toISOString(),
    }
  }
  
  return result[0]
}

export async function updateUserBalance(
  userId: string,
  updates: Partial<Omit<UserBalance, 'user_id'>>
): Promise<UserBalance> {
  const balance = await getUserBalance(userId)
  
  await sql`
    UPDATE user_balance 
    SET balance = ${updates.balance ?? balance.balance},
        total_earned = ${updates.total_earned ?? balance.total_earned},
        total_withdrawn = ${updates.total_withdrawn ?? balance.total_withdrawn},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `
  
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

  await sql`
    INSERT INTO referrals (id, referrer_id, referred_id, referral_code, status, earned_amount, completed_at, created_at)
    VALUES (${id}, ${referrerId}, ${referredId}, ${referralCode}, 'pending', 0, NULL, ${now})
  `

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
  const result = await sql<Referral[]>`
    SELECT * FROM referrals WHERE referrer_id = ${userId} ORDER BY created_at DESC
  `
  return result
}

export async function getReferralByCode(code: string): Promise<Referral | null> {
  const result = await sql<Referral[]>`
    SELECT * FROM referrals WHERE referral_code = ${code}
  `
  return result[0] || null
}

// ========== TRANSACTION OPERATIONS ==========

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const id = randomUUID()
  const now = new Date().toISOString()

  await sql`
    INSERT INTO transactions (id, user_id, type, amount, description, reference_id, reference_type, created_at)
    VALUES (${id}, ${transaction.user_id}, ${transaction.type}, ${transaction.amount}, 
            ${transaction.description}, ${transaction.reference_id || null}, 
            ${transaction.reference_type || null}, ${now})
  `

  return {
    ...transaction,
    id,
    created_at: now,
  }
}

export async function getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const result = await sql<Transaction[]>`
    SELECT * FROM transactions 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `
  return result
}
