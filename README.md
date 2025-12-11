# 🏋️ Course Sport

Профессиональная платформа онлайн-курсов по спорту и фитнесу с поддержкой Telegram Mini App.

![Course Sport](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200)

## ✨ Особенности

- 🎨 **Современный дизайн** — Тёмная тема в стиле SpaceX с красивыми анимациями
- 📱 **Telegram Mini App** — Полная интеграция с Telegram для удобного обучения
- 🗄️ **Supabase Backend** — Надёжная база данных с Row Level Security
- ⚡ **Next.js 14** — Быстрая загрузка с App Router и Server Components
- 🎭 **Framer Motion** — Плавные анимации и переходы
- 📊 **Адаптивный UI** — Отлично выглядит на всех устройствах

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- npm или yarn
- Аккаунт [Supabase](https://supabase.com)

### Установка

1. **Клонируйте репозиторий:**

```bash
git clone https://github.com/DiliCommunity/Course_sport.git
cd Course_sport
```

2. **Установите зависимости:**

```bash
npm install
```

3. **Настройте переменные окружения:**

```bash
cp env.local.example .env.local
```

Отредактируйте `.env.local` и добавьте свои ключи:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Настройте базу данных:**

- Перейдите в Supabase Dashboard → SQL Editor
- Выполните SQL из файла `supabase/schema.sql`

5. **Запустите проект:**

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📁 Структура проекта

```
Course_sport/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Главная страница
│   ├── courses/           # Страницы курсов
│   ├── categories/        # Страницы категорий
│   ├── instructors/       # Страницы тренеров
│   ├── about/             # О компании
│   └── login/             # Авторизация
├── components/
│   ├── layout/            # Header, Footer
│   ├── sections/          # Hero, Features, CTA и др.
│   ├── ui/                # Button, Card, Badge и др.
│   └── providers/         # TelegramProvider
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── hooks/             # React hooks
│   └── utils.ts           # Утилиты
├── types/
│   └── database.ts        # TypeScript типы
├── supabase/
│   └── schema.sql         # SQL схема БД
└── public/                # Статические файлы
```

## 🔧 Технологии

| Технология | Назначение |
|------------|-----------|
| [Next.js 14](https://nextjs.org/) | React фреймворк |
| [TypeScript](https://typescriptlang.org/) | Типизация |
| [Tailwind CSS](https://tailwindcss.com/) | Стили |
| [Framer Motion](https://framer.com/motion/) | Анимации |
| [Supabase](https://supabase.com/) | База данных |
| [Lucide Icons](https://lucide.dev/) | Иконки |

## 📱 Telegram Mini App

Для запуска как Telegram Mini App:

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Создайте Web App и укажите URL вашего деплоя
3. Добавьте `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` в переменные окружения

### Поддерживаемые функции:

- ✅ Main Button для CTA
- ✅ Back Button для навигации
- ✅ Haptic Feedback
- ✅ Theme adaptation
- ✅ User authentication

## 🌐 Деплой

### Vercel (рекомендуется)

1. Подключите репозиторий к [Vercel](https://vercel.com)
2. Добавьте переменные окружения (см. `VERCEL_DEPLOY.md`)
3. Деплой произойдёт автоматически

### Другие платформы

Проект совместим с любой платформой, поддерживающей Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 📝 Лицензия

MIT © [Course Sport Team](https://github.com/DiliCommunity)

---

Сделано с ❤️ для спортсменов по всему миру

