# ✅ Полная настройка Supabase для проекта

## 🎯 Что уже сделано:

1. ✅ Обновлен SQL schema (`supabase/schema.sql`)
2. ✅ Созданы API routes для авторизации:
   - Email/пароль
   - Телефон/OTP
   - Telegram
3. ✅ Обновлен AuthProvider для Supabase
4. ✅ Обновлен package.json

## 📋 Что нужно сделать СЕЙЧАС:

### Шаг 1: Установить зависимости

```bash
npm install @supabase/supabase-js @supabase/ssr
npm uninstall @libsql/client @vercel/blob bcryptjs @types/bcryptjs
```

### Шаг 2: Настроить переменные окружения

Добавьте в `.env.local` и в **Vercel Dashboard** → **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Где взять:**
1. Откройте **Supabase Dashboard** → ваш проект
2. **Settings** → **API**
3. Скопируйте:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### Шаг 3: Выполнить SQL схему

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Скопируйте **весь код** из файла `supabase/schema.sql`
3. Вставьте в SQL Editor
4. Нажмите **"Run"**

Это создаст:
- ✅ Таблицы: `users`, `courses`, `enrollments`, `user_balance`, `referrals`, `transactions`
- ✅ RLS политики для безопасности
- ✅ Триггеры для автоматического создания профиля и баланса
- ✅ Индексы для быстрого поиска

### Шаг 4: Настроить авторизацию в Supabase

#### 4.1. Email авторизация (уже включена)

**Authentication** → **Providers** → **Email**:
- ✅ Email должен быть включен по умолчанию
- Настройте шаблоны писем (опционально)

#### 4.2. Телефон авторизация (SMS)

**Authentication** → **Providers** → **Phone**:
1. Включите **Phone**
2. Выберите провайдера SMS:
   - **Twilio** (рекомендуется)
   - **MessageBird**
   - **Vonage**
3. Введите API ключи провайдера
4. Настройте шаблон SMS:
   ```
   Ваш код подтверждения: {{ .Code }}
   ```

#### 4.3. Telegram авторизация

Telegram авторизация работает через кастомный API route (`/api/auth/telegram`), который:
- Получает данные из Telegram
- Создает пользователя в Supabase
- Сохраняет `telegram_id` в профиле

### Шаг 5: Настроить RLS (Row Level Security)

RLS уже настроен в SQL схеме, но проверьте:

**Supabase Dashboard** → **Authentication** → **Policies**:
- Убедитесь, что RLS включен для всех таблиц
- Политики созданы автоматически через SQL

### Шаг 6: Перезапустить деплой

```bash
# Локально
npm run dev

# В Vercel
Vercel Dashboard → Deployments → Redeploy
```

## 📱 Методы авторизации:

### 1. По Email

**Регистрация:**
```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов"
}
```

**Вход:**
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. По телефону

**Отправка OTP:**
```javascript
POST /api/auth/phone/send-otp
{
  "phone": "+79001234567"
}
```

**Проверка OTP:**
```javascript
POST /api/auth/phone/verify-otp
{
  "phone": "+79001234567",
  "otp": "123456",
  "name": "Иван Иванов" // опционально для регистрации
}
```

### 3. Через Telegram

```javascript
POST /api/auth/telegram
{
  "id": "123456789",
  "first_name": "Иван",
  "last_name": "Иванов",
  "username": "ivan",
  "photo_url": "https://...",
  "phone_number": "+79001234567" // опционально
}
```

## 🔐 Безопасность:

- ✅ **RLS политики** защищают данные
- ✅ Пользователи видят только свои данные
- ✅ Автоматическая проверка через `auth.uid()`
- ✅ Пароли хешируются Supabase
- ✅ OTP коды для телефона

## 📊 Структура данных:

### `auth.users` (Supabase)
- `id` - UUID пользователя
- `email` - Email
- `phone` - Телефон
- `encrypted_password` - Хеш пароля

### `public.users` (Профиль)
- `id` - Связь с `auth.users.id`
- `name` - Имя пользователя
- `avatar_url` - Аватар
- `telegram_id` - ID Telegram
- `phone_verified` - Подтвержден ли телефон
- `email_verified` - Подтвержден ли email
- `telegram_verified` - Подтвержден ли Telegram

### `user_balance`
- `user_id` - ID пользователя
- `balance` - Текущий баланс
- `total_earned` - Всего заработано
- `total_withdrawn` - Всего выведено

### `referrals`
- `referrer_id` - Кто пригласил
- `referred_id` - Кого пригласили
- `referral_code` - Реферальный код
- `status` - Статус (pending/active/completed)
- `earned_amount` - Заработано

### `transactions`
- `user_id` - ID пользователя
- `type` - Тип (earned/withdrawn/spent/refund)
- `amount` - Сумма
- `description` - Описание

## ✅ Готово!

После выполнения всех шагов:
- ✅ Авторизация по email работает
- ✅ Авторизация по телефону работает
- ✅ Авторизация через Telegram работает
- ✅ Профиль пользователя работает
- ✅ Реферальная система работает
- ✅ Баланс и транзакции работают

## 🐛 Отладка:

### Проверить авторизацию:
```javascript
// В браузере консоли
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient('YOUR_URL', 'YOUR_KEY')
const { data: { user } } = await supabase.auth.getUser()
console.log(user)
```

### Проверить профиль:
```sql
-- В Supabase SQL Editor
SELECT * FROM users WHERE id = 'user-id';
SELECT * FROM user_balance WHERE user_id = 'user-id';
```

## 📝 Дополнительно:

### Добавить тестовые данные:

```sql
-- Создать тестового пользователя через Supabase Auth UI
-- Затем обновить профиль:
UPDATE users 
SET name = 'Тестовый пользователь', 
    phone_verified = true 
WHERE id = 'user-id';
```

### Настроить реферальную систему:

При регистрации с реферальным кодом:
```javascript
// В API route регистрации проверяем:
const referralCode = searchParams.get('ref')
if (referralCode) {
  // Создаем запись в referrals
}
```
