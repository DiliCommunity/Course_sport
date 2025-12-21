# 🔴 СРОЧНО: Исправление ошибки "Missing Supabase environment variables"

## ❌ Ошибка в логах:

```
Profile data error: Error: Missing Supabase environment variables
```

**Причина:** Переменные окружения Supabase не добавлены в Vercel или названы неправильно.

---

## ✅ РЕШЕНИЕ: Добавьте эти переменные в Vercel

### Шаг 1: Откройте Vercel Dashboard

1. Перейдите на [vercel.com](https://vercel.com)
2. Выберите проект **course-sport**
3. **Settings** → **Environment Variables**

### Шаг 2: Добавьте ВСЕ эти переменные:

#### 1. NEXT_PUBLIC_SUPABASE_URL

**Где взять:**
- Supabase Dashboard → **Settings** → **API**
- Раздел **"Project URL"**
- Скопируйте URL (например: `https://jsrhtlrwdxefgxiwdvus.supabase.co`)

**В Vercel:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://jsrhtlrwdxefgxiwdvus.supabase.co`
- Environment: ✅ Production, ✅ Preview, ✅ Development

---

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Где взять:**
- Supabase Dashboard → **Settings** → **API Keys**
- Вкладка **"Legacy anon, service_role API keys"**
- Найдите **`anon public`** → нажмите **"Copy"**

**В Vercel:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (ваш полный ключ)
- Environment: ✅ Production, ✅ Preview, ✅ Development

---

#### 3. SUPABASE_SERVICE_ROLE_KEY

**Где взять:**
- Supabase Dashboard → **Settings** → **API Keys**
- Вкладка **"Legacy anon, service_role API keys"**
- Найдите **`service_role secret`** → нажмите **"Reveal"** → **"Copy"**

**В Vercel:**
- Name: `SUPABASE_SERVICE_ROLE_KEY` (БЕЗ `NEXT_PUBLIC_` - это правильно!)
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (ваш полный ключ)
- Environment: ✅ Production, ✅ Preview, ✅ Development

---

#### 4. TELEGRAM_BOT_TOKEN

**Где взять:**
- Откройте **@BotFather** в Telegram
- Отправьте `/mybots`
- Выберите **@Course_Sport_bot**
- Выберите **"API Token"**
- Скопируйте токен

**В Vercel:**
- Name: `TELEGRAM_BOT_TOKEN`
- Value: ваш токен из BotFather
- Environment: ✅ Production, ✅ Preview, ✅ Development

---

#### 5. NEXT_PUBLIC_SITE_URL

**В Vercel:**
- Name: `NEXT_PUBLIC_SITE_URL`
- Value: `https://course-sport.vercel.app`
- Environment: ✅ Production, ✅ Preview, ✅ Development

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО:

### ✅ Правильные имена (с префиксом `NEXT_PUBLIC_`):

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_SITE_URL
```

### ✅ Правильные имена (БЕЗ префикса - для сервера):

```
✅ SUPABASE_SERVICE_ROLE_KEY (без NEXT_PUBLIC_ - это правильно!)
✅ TELEGRAM_BOT_TOKEN (без NEXT_PUBLIC_ - это правильно!)
```

### ❌ НЕПРАВИЛЬНЫЕ имена (НЕ добавляйте!):

```
❌ SUPABASE_URL (без NEXT_PUBLIC_)
❌ SUPABASE_ANON_KEY (без NEXT_PUBLIC_)
```

**Почему:** Код ищет `NEXT_PUBLIC_SUPABASE_URL`, а не `SUPABASE_URL`!

---

## 📝 После добавления переменных:

### 1. Проверьте список

Убедитесь, что у вас есть **ВСЕ 5 переменных:**

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ TELEGRAM_BOT_TOKEN
✅ NEXT_PUBLIC_SITE_URL
```

### 2. Сделайте Redeploy

1. Перейдите в **Deployments**
2. Нажмите **⋮** (три точки) у последнего деплоя
3. Выберите **"Redeploy"**
4. Дождитесь завершения (2-3 минуты)

### 3. Проверьте логи

1. **Deployments** → последний деплой
2. **View Function Logs**
3. Проверьте, что нет ошибок:
   - ❌ "Missing Supabase environment variables" - не должно быть!
   - ✅ Должны быть только ошибки авторизации (если не авторизован)

---

## 🐛 Если ошибка осталась:

### Проверьте:

1. **Имена переменных:**
   - Должны быть ТОЧНО как указано выше
   - С префиксом `NEXT_PUBLIC_` для URL и ANON_KEY

2. **Значения:**
   - URL должен начинаться с `https://`
   - Ключи должны быть полными (не обрезаны)
   - Нет лишних пробелов

3. **Окружения:**
   - Все переменные должны быть для Production, Preview, Development

4. **Redeploy:**
   - После добавления переменных ОБЯЗАТЕЛЬНО сделайте Redeploy!

---

## ✅ После исправления:

1. Ошибка "Missing Supabase environment variables" исчезнет
2. Webhook начнет работать (если `TELEGRAM_BOT_TOKEN` добавлен)
3. Страница профиля будет загружаться
4. Команда `/start` в боте будет работать

---

## 📞 Быстрая проверка:

Откройте в браузере:
```
https://course-sport.vercel.app/api/profile/data
```

**Если переменные добавлены правильно:**
- Вернется `{"error":"Unauthorized"}` (это нормально - нужна авторизация)
- НЕ должно быть `"Missing Supabase environment variables"`

**Если переменные НЕ добавлены:**
- Вернется `{"error":"Missing Supabase environment variables"}`
