# 📝 SQL код для Supabase - Полное руководство

## 🎯 Что нужно сделать:

### Шаг 1: Открыть SQL Editor в Supabase

1. Войдите в **Supabase Dashboard**
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (в левом меню)

### Шаг 2: Выполнить основную схему

1. Откройте файл `supabase/schema.sql` в вашем проекте
2. Скопируйте **весь код** из файла
3. Вставьте в SQL Editor в Supabase
4. Нажмите **"Run"** или **Ctrl+Enter**

Это создаст:
- ✅ Все таблицы (users, courses, enrollments, balance, referrals, transactions)
- ✅ Индексы для быстрого поиска
- ✅ Триггеры для автоматического создания профиля и баланса
- ✅ RLS политики для безопасности

## 📊 Структура таблиц:

### 1. `public.users` - Профили пользователей

Связывается с `auth.users` через `id`.

**Поля:**
- `id` - UUID (связь с auth.users)
- `email` - Email пользователя
- `phone` - Телефон (уникальный)
- `name` - Имя пользователя
- `avatar_url` - Ссылка на аватар
- `telegram_id` - ID Telegram (уникальный)
- `telegram_username` - Username в Telegram
- `phone_verified` - Подтвержден ли телефон
- `email_verified` - Подтвержден ли email
- `telegram_verified` - Подтвержден ли Telegram

**Пример запроса:**
```sql
-- Посмотреть всех пользователей
SELECT * FROM users;

-- Найти пользователя по телефону
SELECT * FROM users WHERE phone = '+79001234567';

-- Найти пользователя по Telegram ID
SELECT * FROM users WHERE telegram_id = '123456789';
```

### 2. `user_balance` - Баланс пользователей

**Поля:**
- `user_id` - ID пользователя (уникальный)
- `balance` - Текущий баланс (в копейках)
- `total_earned` - Всего заработано
- `total_withdrawn` - Всего выведено
- `updated_at` - Дата обновления

**Пример запроса:**
```sql
-- Посмотреть баланс пользователя
SELECT * FROM user_balance WHERE user_id = 'user-uuid';

-- Топ пользователей по балансу
SELECT u.name, ub.balance 
FROM user_balance ub
JOIN users u ON u.id = ub.user_id
ORDER BY ub.balance DESC
LIMIT 10;
```

### 3. `referrals` - Реферальная система

**Поля:**
- `referrer_id` - Кто пригласил (ID пользователя)
- `referred_id` - Кого пригласили (ID пользователя, уникальный)
- `referral_code` - Реферальный код (уникальный)
- `status` - Статус: 'pending', 'active', 'completed'
- `earned_amount` - Заработано с этого реферала
- `completed_at` - Дата завершения

**Пример запроса:**
```sql
-- Посмотреть всех рефералов пользователя
SELECT 
  r.*,
  u1.name as referrer_name,
  u2.name as referred_name
FROM referrals r
JOIN users u1 ON u1.id = r.referrer_id
JOIN users u2 ON u2.id = r.referred_id
WHERE r.referrer_id = 'user-uuid';

-- Найти реферальный код
SELECT * FROM referrals WHERE referral_code = 'REF-ABC123';

-- Статистика по рефералам
SELECT 
  referrer_id,
  COUNT(*) as total_referrals,
  SUM(earned_amount) as total_earned
FROM referrals
GROUP BY referrer_id;
```

### 4. `transactions` - История транзакций

**Поля:**
- `user_id` - ID пользователя
- `type` - Тип: 'earned', 'withdrawn', 'spent', 'refund'
- `amount` - Сумма (в копейках)
- `description` - Описание транзакции
- `reference_id` - Ссылка на связанную запись (enrollment, referral и т.д.)
- `reference_type` - Тип ссылки: 'enrollment', 'referral', 'withdrawal'
- `created_at` - Дата создания

**Пример запроса:**
```sql
-- История транзакций пользователя
SELECT * FROM transactions 
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Все доходы пользователя
SELECT SUM(amount) as total_earned
FROM transactions
WHERE user_id = 'user-uuid' AND type = 'earned';

-- Все расходы пользователя
SELECT SUM(amount) as total_spent
FROM transactions
WHERE user_id = 'user-uuid' AND type = 'spent';
```

### 5. `enrollments` - Записи на курсы

**Поля:**
- `user_id` - ID пользователя
- `course_id` - ID курса
- `progress` - Прогресс (0-100)
- `completed_at` - Дата завершения

**Пример запроса:**
```sql
-- Курсы пользователя
SELECT 
  e.*,
  c.title,
  c.price
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.user_id = 'user-uuid';

-- Завершенные курсы
SELECT * FROM enrollments 
WHERE user_id = 'user-uuid' AND completed_at IS NOT NULL;
```

## 🔧 Полезные SQL запросы:

### Добавить тестового пользователя:

```sql
-- Сначала создайте пользователя через Supabase Auth UI
-- Затем обновите профиль:
UPDATE users 
SET 
  name = 'Тестовый пользователь',
  phone_verified = true,
  email_verified = true
WHERE id = 'user-uuid-from-auth';
```

### Добавить баланс пользователю:

```sql
-- Обновить баланс
UPDATE user_balance
SET 
  balance = balance + 10000, -- +100 рублей
  total_earned = total_earned + 10000
WHERE user_id = 'user-uuid';

-- Создать транзакцию
INSERT INTO transactions (user_id, type, amount, description)
VALUES ('user-uuid', 'earned', 10000, 'Бонус за регистрацию');
```

### Создать реферальную связь:

```sql
-- Создать реферальную запись
INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
VALUES (
  'referrer-uuid',
  'referred-uuid',
  'REF-ABC123',
  'active'
);
```

### Статистика по пользователям:

```sql
-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Пользователи с балансом
SELECT COUNT(*) FROM user_balance WHERE balance > 0;

-- Средний баланс
SELECT AVG(balance) FROM user_balance;

-- Топ рефералов
SELECT 
  u.name,
  COUNT(r.id) as referrals_count,
  SUM(r.earned_amount) as total_earned
FROM users u
JOIN referrals r ON r.referrer_id = u.id
GROUP BY u.id, u.name
ORDER BY referrals_count DESC
LIMIT 10;
```

## 🔐 Безопасность (RLS):

RLS политики уже настроены в схеме. Они гарантируют, что:
- ✅ Пользователи видят только свои данные
- ✅ Пользователи могут обновлять только свой профиль
- ✅ Доступ к балансу и транзакциям только для владельца

**Проверить RLS:**
```sql
-- Включен ли RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## ✅ Готово!

После выполнения SQL схемы:
- ✅ Все таблицы созданы
- ✅ Индексы созданы
- ✅ Триггеры работают
- ✅ RLS политики активны
- ✅ Можно начинать работу!

## 🐛 Отладка:

### Проверить таблицы:
```sql
-- Список всех таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Проверить триггеры:
```sql
-- Список триггеров
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### Проверить индексы:
```sql
-- Список индексов
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```
