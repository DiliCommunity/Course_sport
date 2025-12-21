# ✅ Чек-лист переменных окружения для Vercel

## 🔴 КРИТИЧЕСКИ ВАЖНО: Все переменные должны быть добавлены!

Если видите ошибку **"Missing Supabase environment variables"** - значит переменные не добавлены или названы неправильно.

---

## 📋 Обязательные переменные (добавьте ВСЕ):

### 1. Supabase (для работы приложения):

| Name | Value | Environment | ✅ Обязательно |
|------|-------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jsrhtlrwdxefgxiwdvus.supabase.co` | Production, Preview, Development | ✅ ДА |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development | ✅ ДА |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development | ✅ ДА |

### 2. Telegram Bot (для работы бота):

| Name | Value | Environment | ✅ Обязательно |
|------|-------|-------------|----------------|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` | Production, Preview, Development | ✅ ДА |
| `NEXT_PUBLIC_SITE_URL` | `https://course-sport.vercel.app` | Production, Preview, Development | ✅ ДА |

### 3. Опциональные (для безопасности):

| Name | Value | Environment | ✅ Обязательно |
|------|-------|-------------|----------------|
| `TELEGRAM_WEBHOOK_SECRET` | `случайная_строка` | Production, Preview, Development | ❌ НЕТ |

---

## 🔍 Где взять значения:

### Supabase переменные:

1. **NEXT_PUBLIC_SUPABASE_URL:**
   - Supabase Dashboard → Settings → API
   - Раздел "Project URL"
   - Скопируйте URL (например: `https://jsrhtlrwdxefgxiwdvus.supabase.co`)

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY:**
   - Supabase Dashboard → Settings → API Keys
   - Вкладка "Legacy anon, service_role API keys"
   - Найдите `anon public` → нажмите "Copy"

3. **SUPABASE_SERVICE_ROLE_KEY:**
   - Supabase Dashboard → Settings → API Keys
   - Вкладка "Legacy anon, service_role API keys"
   - Найдите `service_role secret` → нажмите "Reveal" → "Copy"

### Telegram переменные:

1. **TELEGRAM_BOT_TOKEN:**
   - Откройте @BotFather в Telegram
   - `/mybots` → выберите @Course_Sport_bot
   - "API Token" → скопируйте токен

2. **NEXT_PUBLIC_SITE_URL:**
   - Ваш домен на Vercel: `https://course-sport.vercel.app`

---

## ⚠️ ВАЖНО: Префикс `NEXT_PUBLIC_`

**С префиксом `NEXT_PUBLIC_` (доступны в браузере):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_SITE_URL`

**БЕЗ префикса (только для сервера):**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (без `NEXT_PUBLIC_` - это правильно!)
- ✅ `TELEGRAM_BOT_TOKEN` (без `NEXT_PUBLIC_` - это правильно!)

**❌ НЕ добавляйте дубликаты без префикса:**
- ❌ `SUPABASE_URL` (без `NEXT_PUBLIC_`)
- ❌ `SUPABASE_ANON_KEY` (без `NEXT_PUBLIC_`)

---

## 📝 Пошаговая инструкция:

### Шаг 1: Откройте Vercel Dashboard

1. Перейдите на [vercel.com](https://vercel.com)
2. Выберите проект **course-sport**
3. Перейдите в **Settings** → **Environment Variables**

### Шаг 2: Добавьте каждую переменную

Для каждой переменной:
1. Нажмите **"Add New"**
2. Введите **Name** (точно как в таблице выше)
3. Введите **Value** (из Supabase/Telegram)
4. Выберите окружения: ✅ Production, ✅ Preview, ✅ Development
5. Нажмите **"Save"**

### Шаг 3: Проверьте список

Убедитесь, что у вас есть **ВСЕ** эти переменные:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ TELEGRAM_BOT_TOKEN
✅ NEXT_PUBLIC_SITE_URL
```

### Шаг 4: Сделайте Redeploy

1. Перейдите в **Deployments**
2. Нажмите **⋮** (три точки) у последнего деплоя
3. Выберите **"Redeploy"**
4. Дождитесь завершения деплоя

### Шаг 5: Проверьте логи

1. Перейдите в **Deployments** → последний деплой
2. Нажмите **"View Function Logs"**
3. Проверьте, что нет ошибок "Missing Supabase environment variables"

---

## 🐛 Если ошибка не исчезла:

### 1. Проверьте имена переменных:

Убедитесь, что названия **ТОЧНО** совпадают:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (с префиксом!)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (с префиксом!)
- ❌ НЕ `SUPABASE_URL` или `SUPABASE_ANON_KEY`

### 2. Проверьте окружения:

Убедитесь, что переменные добавлены для:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 3. Проверьте значения:

- URL должен начинаться с `https://`
- Ключи должны быть полными (не обрезаны)
- Нет лишних пробелов в начале/конце

### 4. Очистите кеш и передеплойте:

1. Settings → General → **Clear Build Cache**
2. Сделайте новый **Redeploy**

---

## ✅ Проверка после настройки:

### Тест 1: Проверьте API профиля

Откройте в браузере (должен вернуть данные или ошибку авторизации, НЕ "Missing variables"):
```
https://course-sport.vercel.app/api/profile/data
```

### Тест 2: Проверьте Telegram бота

1. Откройте бота @Course_Sport_bot
2. Отправьте `/start`
3. Должно прийти приветственное сообщение с фото

### Тест 3: Проверьте логи

В логах Vercel не должно быть:
- ❌ "Missing Supabase environment variables"
- ❌ "TELEGRAM_BOT_TOKEN not configured"

---

## 📞 Быстрая справка:

**Где взять Supabase переменные:**
- URL: Settings → API → Project URL
- Anon Key: Settings → API Keys → Legacy → `anon public`
- Service Role: Settings → API Keys → Legacy → `service_role` → Reveal

**Где взять Telegram переменные:**
- Token: @BotFather → /mybots → API Token
- Site URL: ваш домен Vercel

**Куда добавить:**
- Vercel Dashboard → Settings → Environment Variables

**После добавления:**
- Обязательно сделайте **Redeploy**!
