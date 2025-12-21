# 🔑 Настройка переменных окружения Supabase

## ❌ Ошибка: "Missing Supabase environment variables"

Эта ошибка возникает, когда приложение не может найти необходимые переменные окружения Supabase.

## 📋 Какие переменные нужны:

1. **`NEXT_PUBLIC_SUPABASE_URL`** - URL вашего проекта Supabase
2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Публичный (anon) ключ
3. **`SUPABASE_SERVICE_ROLE_KEY`** - Секретный ключ (для серверных операций)

---

## 🔍 Где взять значения из Supabase:

### 1. **NEXT_PUBLIC_SUPABASE_URL**

**Где найти:**
- Откройте Supabase Dashboard
- Перейдите в **Settings** → **API** (или **Data API**)
- Найдите раздел **"Project URL"**
- Скопируйте URL (например: `https://jsrhtlrwdxefgxiwdvus.supabase.co`)

**Пример:**
```
NEXT_PUBLIC_SUPABASE_URL=https://jsrhtlrwdxefgxiwdvus.supabase.co
```

---

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**

**Где найти:**
- Откройте Supabase Dashboard
- Перейдите в **Settings** → **API Keys**
- Выберите вкладку **"Legacy anon, service_role API keys"**
- Найдите **`anon public`** ключ
- Нажмите кнопку **"Copy"** рядом с ключом

**Пример:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzcmh0bHJ3ZHhlZmd4aXd2dXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MjE2MDAsImV4cCI6MjA1MDM5NzYwMH0.xxxxx
```

⚠️ **Важно:** Этот ключ безопасен для использования в браузере, если у вас включен RLS (Row Level Security).

---

### 3. **SUPABASE_SERVICE_ROLE_KEY**

**Где найти:**
- Откройте Supabase Dashboard
- Перейдите в **Settings** → **API Keys**
- Выберите вкладку **"Legacy anon, service_role API keys"**
- Найдите **`service_role secret`** ключ
- Нажмите кнопку **"Reveal"** чтобы показать ключ (он скрыт звездочками)
- Нажмите кнопку **"Copy"** чтобы скопировать

**Пример:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzcmh0bHJ3ZHhlZmd4aXd2dXVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDgyMTYwMCwiZXhwIjoyMDUwMzk3NjAwfQ.xxxxx
```

⚠️ **КРИТИЧЕСКИ ВАЖНО:** 
- **НИКОГДА** не публикуйте этот ключ в публичных репозиториях!
- Этот ключ обходит RLS и имеет полный доступ к базе данных
- Используется только на сервере (в API routes)

---

## 📝 Куда вставить переменные:

### **Вариант 1: Локальная разработка (.env.local)**

1. Создайте файл `.env.local` в корне проекта (рядом с `package.json`)
2. Скопируйте содержимое из `env.local.example`
3. Замените значения на реальные из Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jsrhtlrwdxefgxiwdvus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram Bot Configuration (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Перезапустите dev сервер:**
   ```bash
   npm run dev
   ```

---

### **Вариант 2: Vercel (Production/Preview/Development)**

1. Откройте ваш проект на [Vercel Dashboard](https://vercel.com)
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте каждую переменную:

   **Для Production, Preview и Development:**
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://jsrhtlrwdxefgxiwdvus.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

4. Нажмите **"Save"** для каждой переменной
5. **Передеплойте проект:**
   - Перейдите в **Deployments**
   - Нажмите на три точки (⋮) у последнего деплоя
   - Выберите **"Redeploy"**

---

## ✅ Проверка настройки:

### Локально:
1. Убедитесь, что файл `.env.local` существует
2. Проверьте, что переменные заполнены (без `your_...`)
3. Перезапустите сервер: `npm run dev`
4. Откройте консоль браузера - ошибка должна исчезнуть

### На Vercel:
1. Проверьте, что все переменные добавлены в Environment Variables
2. Убедитесь, что они доступны для нужных окружений (Production/Preview/Development)
3. Сделайте redeploy проекта
4. Проверьте логи деплоя - не должно быть ошибок о missing variables

---

## 🔒 Безопасность:

- ✅ `.env.local` уже в `.gitignore` - не попадет в Git
- ✅ `NEXT_PUBLIC_*` переменные доступны в браузере (публичные)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - **НИКОГДА** не используйте в клиентском коде!
- ⚠️ Не коммитьте `.env.local` в Git

---

## 🐛 Если ошибка не исчезла:

1. **Проверьте синтаксис:**
   - Нет лишних пробелов
   - Нет кавычек вокруг значений (если не требуется)
   - Правильные имена переменных (с `NEXT_PUBLIC_` для клиентских)

2. **Очистите кеш:**
   ```bash
   # Удалите .next папку
   rm -rf .next
   # Перезапустите
   npm run dev
   ```

3. **Проверьте значения:**
   - URL должен начинаться с `https://`
   - Ключи должны быть полными (не обрезаны)
   - Нет лишних символов в начале/конце

4. **Проверьте логи:**
   - В браузере: Console (F12)
   - На Vercel: Deployments → View Function Logs

---

## 📞 Быстрая справка:

**Где взять:**
- URL: Settings → API → Project URL
- Anon Key: Settings → API Keys → Legacy → `anon public`
- Service Role: Settings → API Keys → Legacy → `service_role` → Reveal

**Куда вставить:**
- Локально: `.env.local` (в корне проекта)
- Vercel: Settings → Environment Variables

**После изменений:**
- Локально: Перезапустить `npm run dev`
- Vercel: Сделать Redeploy
