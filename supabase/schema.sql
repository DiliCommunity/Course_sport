-- Course Sport Database Schema for Supabase
-- Выполните этот SQL в Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (расширение auth.users)
-- =====================================================
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
    telegram_verified BOOLEAN DEFAULT false,
    -- Метод регистрации: 'email', 'phone', 'telegram'
    registration_method VARCHAR(20) CHECK (registration_method IN ('email', 'phone', 'telegram')),
    -- Telegram Wallet для оплаты криптой
    telegram_wallet_address TEXT,
    telegram_wallet_connected BOOLEAN DEFAULT false,
    telegram_wallet_connected_at TIMESTAMPTZ
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
-- COURSES TABLE (без instructor_id)
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
-- USER REFERRAL CODES TABLE
-- =====================================================
-- Хранит реферальные коды пользователей
CREATE TABLE IF NOT EXISTS user_referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_uses INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- REFERRALS TABLE (улучшенная реферальная система)
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    -- Заработок реферера
    referrer_earned INTEGER NOT NULL DEFAULT 0,
    -- Заработок реферала (бонус за регистрацию)
    referred_bonus INTEGER NOT NULL DEFAULT 0,
    -- Процент от покупок реферала
    commission_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    -- Всего заработано с покупок реферала
    total_earned_from_purchases INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'withdrawn', 'spent', 'refund', 'referral_bonus', 'referral_commission')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    -- Для реферальных транзакций
    referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL
);

-- =====================================================
-- PAYMENTS TABLE (для оплаты через Telegram Wallet)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('telegram_wallet', 'balance', 'card', 'crypto')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    telegram_wallet_transaction_id TEXT,
    telegram_wallet_address TEXT,
    completed_at TIMESTAMPTZ,
    metadata JSONB
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_registration_method ON public.users(registration_method);
CREATE INDEX IF NOT EXISTS idx_user_balance_user ON user_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_referral ON transactions(referral_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_course ON payments(course_id);

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
$$ LANGUAGE plpgsql
SET search_path = public;

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
$$ LANGUAGE plpgsql
SET search_path = public;

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
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER trigger_update_students_count
    AFTER INSERT OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_students_count();

-- =====================================================
-- FUNCTION: Создать профиль пользователя при регистрации
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referral_code_value TEXT;
BEGIN
    -- Получаем реферальный код из метаданных
    referral_code_value := NULL;
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        referral_code_value := NEW.raw_user_meta_data->>'referral_code';
    END IF;

    INSERT INTO public.users (id, email, phone, name, registration_method)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        COALESCE(
            NEW.raw_user_meta_data->>'name', 
            NEW.raw_user_meta_data->>'full_name', 
            'Пользователь'
        ),
        CASE
            WHEN NEW.phone IS NOT NULL THEN 'phone'
            WHEN NEW.email IS NOT NULL AND (NEW.email NOT LIKE 'telegram_%@temp.com') THEN 'email'
            WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL THEN 'telegram'
            ELSE 'email'
        END
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Если есть реферальный код, обрабатываем его после создания пользователя
    -- Это будет сделано через триггер process_referral_registration
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Триггер для автоматического создания баланса
CREATE TRIGGER on_user_created_balance
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_balance();

-- =====================================================
-- FUNCTION: Генерация реферального кода
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Генерируем код формата: REF-XXXXXX
        code := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6));
        
        -- Проверяем уникальность
        SELECT EXISTS(SELECT 1 FROM user_referral_codes WHERE referral_code = code) INTO exists_check;
        
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- =====================================================
-- FUNCTION: Создать реферальный код для пользователя
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Генерируем уникальный код
    new_code := public.generate_referral_code();
    
    -- Создаем запись
    INSERT INTO user_referral_codes (user_id, referral_code, is_active, total_uses, total_earned)
    VALUES (NEW.id, new_code, true, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Триггер для автоматического создания реферального кода
CREATE TRIGGER on_user_created_referral_code
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_referral_code();

-- =====================================================
-- FUNCTION: Обработка реферала при регистрации
-- =====================================================
CREATE OR REPLACE FUNCTION public.process_referral_registration()
RETURNS TRIGGER AS $$
DECLARE
    referrer_user_id UUID;
    referral_code_record RECORD;
    bonus_amount INTEGER := 10000; -- Бонус за регистрацию (в копейках, 100 рублей = 10000)
    referrer_bonus INTEGER := 5000; -- Бонус рефереру (50 рублей = 5000)
    commission_percent DECIMAL(5, 2) := 10.00; -- 10% комиссия с покупок
    referral_code_value TEXT;
    auth_user_record RECORD;
BEGIN
    -- Получаем данные из auth.users для доступа к raw_user_meta_data
    SELECT raw_user_meta_data INTO auth_user_record
    FROM auth.users
    WHERE id = NEW.id;
    
    -- Ищем реферальный код в метаданных
    referral_code_value := NULL;
    IF auth_user_record.raw_user_meta_data IS NOT NULL THEN
        referral_code_value := auth_user_record.raw_user_meta_data->>'referral_code';
    END IF;
    
    -- Если код найден, обрабатываем реферала
    IF referral_code_value IS NOT NULL AND referral_code_value != '' THEN
        -- Находим владельца кода
        SELECT urc.user_id INTO referrer_user_id
        FROM user_referral_codes urc
        WHERE urc.referral_code = referral_code_value
        AND urc.is_active = true
        LIMIT 1;
        
        IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
            -- Создаем запись о реферале
            INSERT INTO referrals (
                referrer_id,
                referred_id,
                referral_code,
                status,
                referred_bonus,
                commission_percent
            ) VALUES (
                referrer_user_id,
                NEW.id,
                referral_code_value,
                'active',
                bonus_amount,
                commission_percent
            )
            ON CONFLICT (referred_id) DO NOTHING;
            
            -- Обновляем статистику кода
            UPDATE user_referral_codes
            SET total_uses = total_uses + 1
            WHERE user_id = referrer_user_id;
            
            -- Начисляем бонус рефералу
            UPDATE user_balance
            SET balance = balance + bonus_amount,
                total_earned = total_earned + bonus_amount
            WHERE user_id = NEW.id;
            
            -- Создаем транзакцию для реферала
            INSERT INTO transactions (user_id, type, amount, description, reference_type)
            VALUES (NEW.id, 'referral_bonus', bonus_amount, 'Бонус за регистрацию по реферальной ссылке', 'referral_registration');
            
            -- Начисляем бонус рефереру
            UPDATE user_balance
            SET balance = balance + referrer_bonus,
                total_earned = total_earned + referrer_bonus
            WHERE user_id = referrer_user_id;
            
            -- Обновляем заработок реферера в referrals
            UPDATE referrals
            SET referrer_earned = referrer_earned + referrer_bonus
            WHERE referrer_id = referrer_user_id AND referred_id = NEW.id;
            
            -- Обновляем статистику реферального кода
            UPDATE user_referral_codes
            SET total_earned = total_earned + referrer_bonus
            WHERE user_id = referrer_user_id;
            
            -- Создаем транзакцию для реферера
            INSERT INTO transactions (user_id, type, amount, description, reference_type, referral_id)
            SELECT 
                referrer_user_id, 
                'referral_bonus', 
                referrer_bonus, 
                'Бонус за приглашение друга', 
                'referral_registration',
                r.id
            FROM referrals r
            WHERE r.referrer_id = referrer_user_id AND r.referred_id = NEW.id
            LIMIT 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Триггер для обработки реферала при регистрации
-- Вызывается после создания пользователя в public.users
CREATE TRIGGER on_user_registered_referral
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.process_referral_registration();

-- =====================================================
-- FUNCTION: Начисление комиссии рефереру при покупке курса
-- =====================================================
CREATE OR REPLACE FUNCTION public.process_referral_purchase()
RETURNS TRIGGER AS $$
DECLARE
    referral_record RECORD;
    commission_amount INTEGER;
    course_price INTEGER;
    old_status TEXT;
BEGIN
    -- Получаем старый статус (если это UPDATE)
    IF TG_OP = 'UPDATE' THEN
        old_status := OLD.status;
    ELSE
        old_status := NULL;
    END IF;
    
    -- Обрабатываем только если статус изменился на 'completed'
    IF NEW.status = 'completed' AND (old_status IS NULL OR old_status != 'completed') THEN
        -- Если это покупка курса
        IF NEW.course_id IS NOT NULL THEN
            -- Получаем цену курса
            SELECT price INTO course_price
            FROM courses
            WHERE id = NEW.course_id;
            
            IF course_price IS NOT NULL AND course_price > 0 THEN
                -- Ищем активную реферальную связь
                SELECT * INTO referral_record
                FROM referrals
                WHERE referred_id = NEW.user_id
                AND status = 'active'
                LIMIT 1;
                
                IF referral_record IS NOT NULL THEN
                    -- Вычисляем комиссию (процент от покупки)
                    commission_amount := FLOOR(course_price * (referral_record.commission_percent / 100));
                    
                    IF commission_amount > 0 THEN
                        -- Обновляем заработок реферера
                        UPDATE referrals
                        SET referrer_earned = referrer_earned + commission_amount,
                            total_earned_from_purchases = total_earned_from_purchases + commission_amount
                        WHERE id = referral_record.id;
                        
                        -- Начисляем комиссию на баланс реферера
                        UPDATE user_balance
                        SET balance = balance + commission_amount,
                            total_earned = total_earned + commission_amount
                        WHERE user_id = referral_record.referrer_id;
                        
                        -- Обновляем статистику реферального кода
                        UPDATE user_referral_codes
                        SET total_earned = total_earned + commission_amount
                        WHERE user_id = referral_record.referrer_id;
                        
                        -- Создаем транзакцию для реферера
                        INSERT INTO transactions (
                            user_id,
                            type,
                            amount,
                            description,
                            reference_id,
                            reference_type,
                            referral_id
                        ) VALUES (
                            referral_record.referrer_id,
                            'referral_commission',
                            commission_amount,
                            'Комиссия с покупки курса рефералом',
                            NEW.id,
                            'payment',
                            referral_record.id
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Триггер для обработки покупок рефералов (только при INSERT или UPDATE на completed)
CREATE TRIGGER on_payment_completed_referral
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION public.process_referral_purchase();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

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
-- CATEGORIES POLICIES
-- =====================================================

-- Все могут читать категории
CREATE POLICY "Anyone can read categories"
    ON categories FOR SELECT
    USING (true);

-- =====================================================
-- COURSES POLICIES
-- =====================================================

-- Все могут читать опубликованные курсы
CREATE POLICY "Anyone can read published courses"
    ON courses FOR SELECT
    USING (is_published = true);

-- =====================================================
-- LESSONS POLICIES
-- =====================================================

-- Все могут читать уроки (но доступ к видео контролируется на уровне приложения)
CREATE POLICY "Anyone can read lessons"
    ON lessons FOR SELECT
    USING (true);

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
-- USER REFERRAL CODES POLICIES
-- =====================================================

-- Пользователи могут читать свой реферальный код
CREATE POLICY "Users can read own referral code"
    ON user_referral_codes FOR SELECT
    USING (auth.uid() = user_id);

-- Все могут читать реферальные коды (для проверки при регистрации)
CREATE POLICY "Anyone can read referral codes"
    ON user_referral_codes FOR SELECT
    USING (true);

-- =====================================================
-- REFERRALS POLICIES
-- =====================================================

-- Пользователи могут читать свои рефералы
CREATE POLICY "Users can read own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Пользователи могут создавать рефералы (через триггер)
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
-- PAYMENTS POLICIES
-- =====================================================

-- Пользователи могут читать свои платежи
CREATE POLICY "Users can read own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- Пользователи могут создавать свои платежи
CREATE POLICY "Users can create own payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SEED DATA (только категории, без тренеров)
-- =====================================================

-- Insert categories
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Кето-диета', 'keto', 'Низкоуглеводная диета для эффективного жиросжигания', 'heart', 'electric'),
('Интервальное голодание', 'intermittent-fasting', 'Режим питания для здоровья и энергии', 'clock', 'neon'),
('Здоровое питание', 'healthy-nutrition', 'Сбалансированное питание для долголетия', 'apple', 'gold'),
('Фитнес', 'fitness', 'Комплексные тренировки для развития всего тела', 'dumbbell', 'electric'),
('Йога', 'yoga', 'Практики для гибкости, баланса и ментального здоровья', 'heart', 'purple')
ON CONFLICT (slug) DO NOTHING;
