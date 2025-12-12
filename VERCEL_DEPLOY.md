# 🚀 Деплой на Vercel

Инструкция по деплою Course Sport на Vercel.

## Переменные окружения для Vercel

Добавьте следующие переменные в настройках проекта Vercel:  
**Settings → Environment Variables**

### 🔴 ОБЯЗАТЕЛЬНЫЕ переменные

| Переменная | Описание | Где взять | Пример |
|------------|----------|-----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL вашего Supabase проекта | Supabase Dashboard → Settings → API → Project URL | `https://abcdefghijk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный ключ Supabase (anon key) | Supabase Dashboard → Settings → API → anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `TELEGRAM_BOT_TOKEN` | **Секретный токен бота** (для работы с Bot API) | @BotFather → `/token` → выберите бота | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `NEXT_PUBLIC_APP_URL` | **URL вашего деплоя на Vercel** | После деплоя скопируйте URL из Vercel Dashboard | `https://course-sport.vercel.app` |

### 🟡 РЕКОМЕНДУЕМЫЕ переменные

| Переменная | Описание | Где взять | Пример |
|------------|----------|-----------|--------|
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username вашего Telegram бота (без @) | @BotFather → `/mybots` → выберите бота | `CourseSportBot` |

## Пошаговая инструкция

### 1. Подготовка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в **SQL Editor** и выполните код из `supabase/schema.sql`
3. Скопируйте данные из **Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Подготовка Telegram Bot

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота: `/newbot`
3. Запишите:
   - **Username бота** (без @) → `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
   - **Токен бота** → `/token` → выберите бота → скопируйте токен → `TELEGRAM_BOT_TOKEN`
4. Настройте Web App:
   - `/mybots` → выберите бота → **Bot Settings** → **Menu Button**
   - Или `/setmenubutton` → выберите бота → укажите URL деплоя (после деплоя на Vercel)
   - URL должен быть: `https://your-project.vercel.app`

### 3. Деплой на Vercel

#### Вариант A: Через GitHub

1. Запушьте код в GitHub репозиторий
2. Перейдите на [vercel.com](https://vercel.com)
3. Нажмите **Add New... → Project**
4. Выберите репозиторий `DiliCommunity/Course_sport`
5. **Добавьте ВСЕ переменные окружения** (см. таблицу выше)
6. Нажмите **Deploy**

#### Вариант B: Через CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Залогиньтесь
vercel login

# Деплой
vercel

# Для production
vercel --prod
```

### 4. После деплоя

1. Скопируйте URL вашего деплоя из Vercel Dashboard (например: `https://course-sport.vercel.app`)
2. Обновите переменную `NEXT_PUBLIC_APP_URL` в Vercel:
   - Settings → Environment Variables → Edit
   - Установите значение: `https://your-actual-vercel-url.vercel.app`
3. Настройте Telegram Web App с этим URL в BotFather

### 5. Настройка домена (опционально)

1. В Vercel Dashboard → выберите проект → Settings → Domains
2. Добавьте свой домен
3. Настройте DNS записи согласно инструкции
4. Обновите `NEXT_PUBLIC_APP_URL` на новый домен

## Проверка деплоя

После успешного деплоя проверьте:

- [ ] Главная страница загружается корректно
- [ ] Анимации работают плавно
- [ ] Страницы курсов, категорий, тренеров доступны
- [ ] Telegram Mini App открывается (если настроен бот)
- [ ] Данные из Supabase загружаются (после заполнения БД)
- [ ] Регистрация через Telegram работает

## Troubleshooting

### Ошибка "Invalid Supabase URL"
- Проверьте формат URL: должен быть `https://xxx.supabase.co`
- Убедитесь, что нет лишних пробелов в переменных

### Ошибка "Failed to fetch"
- Проверьте RLS политики в Supabase
- Убедитесь, что anon key корректный

### Telegram Mini App не работает
- Убедитесь, что URL в BotFather совпадает с URL деплоя
- Проверьте HTTPS (обязательно для Telegram)
- Убедитесь, что `NEXT_PUBLIC_APP_URL` установлен правильно

### Ошибка "Missing Supabase environment variables"
- Проверьте, что все переменные добавлены в Vercel
- Убедитесь, что переменные добавлены для всех окружений (Production, Preview, Development)

## Полезные ссылки

- [Документация Vercel](https://vercel.com/docs)
- [Документация Supabase](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 📋 Все переменные для копирования

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername

# App URL (замени после деплоя!)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**⚠️ ВАЖНО:** 
- `TELEGRAM_BOT_TOKEN` - это **секретный токен**, не публикуй его в коде!
- `NEXT_PUBLIC_APP_URL` обнови **после первого деплоя** на реальный URL Vercel
