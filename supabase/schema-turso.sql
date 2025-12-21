-- Course Health Database Schema for Turso (SQLite)
-- Выполните этот SQL в Turso SQL Editor

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    telegram_id TEXT UNIQUE,
    telegram_username TEXT,
    password_hash TEXT
);

-- =====================================================
-- SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'dumbbell',
    color TEXT NOT NULL DEFAULT 'electric'
);

-- =====================================================
-- INSTRUCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS instructors (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    students_count INTEGER NOT NULL DEFAULT 0,
    courses_count INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0.00
);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    image_url TEXT NOT NULL,
    category_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_published INTEGER NOT NULL DEFAULT 0,
    students_count INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0.00,
    lessons_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);

-- =====================================================
-- LESSONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    video_url TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_free INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- =====================================================
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TEXT,
    UNIQUE(user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- =====================================================
-- USER BALANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_balance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_withdrawn INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    referrer_id TEXT NOT NULL,
    referred_id TEXT NOT NULL UNIQUE,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    earned_amount INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'withdrawn', 'spent', 'refund')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT,
    reference_type TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_balance_user ON user_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
