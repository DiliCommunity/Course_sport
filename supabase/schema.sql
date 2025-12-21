-- Course Sport Database Schema for Supabase
-- Выполните этот SQL в Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'dumbbell',
    color VARCHAR(50) NOT NULL DEFAULT 'electric'
);

-- =====================================================
-- INSTRUCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS instructors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name VARCHAR(200) NOT NULL,
    bio TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    specialization VARCHAR(200) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    students_count INTEGER NOT NULL DEFAULT 0,
    courses_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00
);

-- =====================================================
-- COURSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500) NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    image_url TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_published BOOLEAN NOT NULL DEFAULT false,
    students_count INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    lessons_count INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- LESSONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    video_url TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT false
);

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(200) NOT NULL,
    avatar_url TEXT,
    telegram_id VARCHAR(50) UNIQUE,
    telegram_username VARCHAR(100)
);

-- =====================================================
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- =====================================================
-- LESSON PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    watch_time_seconds INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    UNIQUE(user_id, course_id)
);

-- =====================================================
-- USER BALANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_balance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_withdrawn INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    earned_amount INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'withdrawn', 'spent', 'refund')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID, -- ссылка на enrollment, referral и т.д.
    reference_type VARCHAR(50) -- 'enrollment', 'referral', 'withdrawal' и т.д.
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update course lessons count
CREATE OR REPLACE FUNCTION update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses SET lessons_count = lessons_count + 1 WHERE id = NEW.course_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses SET lessons_count = lessons_count - 1 WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lessons_count
    AFTER INSERT OR DELETE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_course_lessons_count();

-- Update course students count
CREATE OR REPLACE FUNCTION update_course_students_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses SET students_count = students_count + 1 WHERE id = NEW.course_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses SET students_count = students_count - 1 WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_students_count
    AFTER INSERT OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_students_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Public read access for categories, instructors, courses
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access for instructors" ON instructors FOR SELECT USING (true);
CREATE POLICY "Public read access for published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Public read access for lessons of published courses" ON lessons FOR SELECT 
    USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.is_published = true));

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text OR telegram_id IS NOT NULL);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Enrollments
CREATE POLICY "Users can read own enrollments" ON enrollments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Lesson progress
CREATE POLICY "Users can manage own lesson progress" ON lesson_progress FOR ALL USING (auth.uid()::text = user_id::text);

-- Reviews
CREATE POLICY "Public read access for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON reviews FOR ALL USING (auth.uid()::text = user_id::text);

-- User Balance
CREATE POLICY "Users can read own balance" ON user_balance FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own balance" ON user_balance FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Referrals
CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (auth.uid()::text = referrer_id::text OR auth.uid()::text = referred_id::text);
CREATE POLICY "Users can create referrals" ON referrals FOR INSERT WITH CHECK (auth.uid()::text = referrer_id::text);

-- Transactions
CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can create transactions" ON transactions FOR INSERT WITH CHECK (true); -- через service role

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert categories
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Фитнес', 'fitness', 'Комплексные тренировки для развития всего тела', 'dumbbell', 'electric'),
('Йога', 'yoga', 'Практики для гибкости, баланса и ментального здоровья', 'heart', 'purple'),
('Единоборства', 'martial-arts', 'Бокс, ММА, каратэ и другие боевые искусства', 'swords', 'flame'),
('Кроссфит', 'crossfit', 'Высокоинтенсивные функциональные тренировки', 'flame', 'neon'),
('Кардио', 'cardio', 'Бег, велосипед, плавание и другие кардионагрузки', 'bike', 'gold'),
('Растяжка', 'stretching', 'Упражнения для развития гибкости и подвижности', 'waves', 'electric'),
('Пилатес', 'pilates', 'Укрепление мышц кора и улучшение осанки', 'target', 'purple'),
('Силовой тренинг', 'strength', 'Набор мышечной массы и развитие силы', 'dumbbell', 'flame')
ON CONFLICT (slug) DO NOTHING;

-- Insert instructors
INSERT INTO instructors (name, bio, avatar_url, specialization, experience_years, students_count, courses_count, rating) VALUES
('Алексей Морозов', 'Мастер спорта по фитнесу, сертифицированный тренер с 15-летним стажем.', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400', 'Фитнес и силовой тренинг', 15, 12453, 8, 4.9),
('Елена Соколова', 'Инструктор йоги международного класса, практикует более 20 лет.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Йога и медитация', 20, 8721, 6, 4.8),
('Дмитрий Волков', 'Чемпион России по боксу, тренер сборной.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Бокс и единоборства', 18, 5432, 4, 4.9),
('Марина Петрова', 'Сертифицированный CrossFit Level 3 тренер.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Кроссфит', 10, 7856, 5, 4.7)
ON CONFLICT DO NOTHING;

