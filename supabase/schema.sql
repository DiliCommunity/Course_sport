-- Course Sport Database Schema for Supabase
-- Выполните этот SQL в Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (расширение auth.users)
-- =====================================================
-- Связываем с auth.users через id
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(200) NOT NULL,
    avatar_url TEXT,
    telegram_id VARCHAR(50) UNIQUE,
    telegram_username VARCHAR(100),
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    telegram_verified BOOLEAN DEFAULT false
);

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
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
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
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL UNIQUE,
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
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'withdrawn', 'spent', 'refund')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50)
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
CREATE INDEX IF NOT EXISTS idx_users_telegram ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
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

CREATE TRIGGER update_user_balance_updated_at
    BEFORE UPDATE ON user_balance
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
-- FUNCTION: Создать профиль пользователя при регистрации
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, phone, name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Пользователь')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: Создать баланс пользователя
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_balance (user_id, balance, total_earned, total_withdrawn)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания баланса
CREATE TRIGGER on_user_created_balance
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_balance();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Пользователи могут читать свой профиль
CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- ENROLLMENTS POLICIES
-- =====================================================

-- Пользователи могут читать свои записи на курсы
CREATE POLICY "Users can read own enrollments"
    ON enrollments FOR SELECT
    USING (auth.uid() = user_id);

-- Пользователи могут создавать записи на курсы
CREATE POLICY "Users can create own enrollments"
    ON enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои записи
CREATE POLICY "Users can update own enrollments"
    ON enrollments FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- LESSON PROGRESS POLICIES
-- =====================================================

-- Пользователи могут читать свой прогресс
CREATE POLICY "Users can read own lesson progress"
    ON lesson_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Пользователи могут создавать/обновлять свой прогресс
CREATE POLICY "Users can manage own lesson progress"
    ON lesson_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Все могут читать отзывы
CREATE POLICY "Anyone can read reviews"
    ON reviews FOR SELECT
    USING (true);

-- Пользователи могут создавать свои отзывы
CREATE POLICY "Users can create own reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои отзывы
CREATE POLICY "Users can update own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- USER BALANCE POLICIES
-- =====================================================

-- Пользователи могут читать свой баланс
CREATE POLICY "Users can read own balance"
    ON user_balance FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- REFERRALS POLICIES
-- =====================================================

-- Пользователи могут читать свои рефералы
CREATE POLICY "Users can read own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Пользователи могут создавать рефералы
CREATE POLICY "Users can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Пользователи могут читать свои транзакции
CREATE POLICY "Users can read own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

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
