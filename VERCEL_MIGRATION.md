# Миграция на Vercel KV и Blob Storage

## Установка зависимостей

```bash
npm install @vercel/kv @vercel/blob bcryptjs
npm install --save-dev @types/bcryptjs
```

## Настройка переменных окружения в Vercel

Добавьте следующие переменные в настройках проекта Vercel:

1. **KV_REST_API_URL** - URL вашего Vercel KV хранилища
2. **KV_REST_API_TOKEN** - токен доступа к Vercel KV
3. **BLOB_READ_WRITE_TOKEN** - токен для записи в Vercel Blob Storage

### Как получить эти переменные:

1. **Vercel KV:**
   - Перейдите в Vercel Dashboard → Storage → Create Database → KV
   - После создания скопируйте `KV_REST_API_URL` и `KV_REST_API_TOKEN`

2. **Vercel Blob Storage:**
   - Перейдите в Vercel Dashboard → Storage → Create Database → Blob
   - После создания скопируйте `BLOB_READ_WRITE_TOKEN`

## Изменения в коде

### Удалены зависимости:
- `@supabase/supabase-js`
- `@supabase/ssr`

### Добавлены зависимости:
- `@vercel/kv` - для работы с Redis-совместимым хранилищем
- `@vercel/blob` - для работы с файловым хранилищем
- `bcryptjs` - для хеширования паролей

### Новые файлы:
- `lib/vercel/kv.ts` - утилиты для работы с KV
- `lib/vercel/blob.ts` - утилиты для работы с Blob Storage
- `lib/auth-session.ts` - управление сессиями через cookies

### Обновленные файлы:
- Все API routes в `app/api/` переделаны под Vercel KV
- `components/providers/AuthProvider.tsx` - обновлен для новой системы
- `lib/auth.ts` - переделан под новую систему аутентификации

## Структура данных в KV

Данные хранятся в формате ключ-значение:

- `user:{id}` - данные пользователя
- `user:email:{email}` - маппинг email → user_id
- `user:telegram:{telegram_id}` - маппинг telegram_id → user_id
- `session:{session_id}` - сессии пользователей
- `sessions:user:{user_id}` - список сессий пользователя
- `enrollment:{id}` - записи о курсах
- `enrollments:user:{user_id}` - список курсов пользователя
- `balance:user:{user_id}` - баланс пользователя
- `referral:{id}` - реферальные записи
- `referrals:user:{user_id}` - рефералы пользователя
- `transaction:{id}` - транзакции
- `transactions:user:{user_id}` - транзакции пользователя

## Миграция данных (если нужно)

Если у вас уже есть данные в Supabase, нужно создать скрипт миграции для переноса данных в Vercel KV. Это можно сделать через API или напрямую через KV CLI.

## Проверка работы

После настройки переменных окружения:

1. Проверьте регистрацию пользователя: `/api/auth/register`
2. Проверьте вход: `/api/auth/login`
3. Проверьте профиль: `/api/profile/data`
4. Проверьте загрузку аватара: `/api/profile/avatar`

## Важные замечания

- Сессии теперь хранятся в cookies с именем `session_id`
- Пароли хешируются с помощью bcryptjs
- Все файлы (аватары) хранятся в Vercel Blob Storage
- KV автоматически удаляет истекшие сессии (TTL)
