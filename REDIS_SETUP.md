# Настройка Redis вместо Vercel KV

## Что использовать?

На скриншотах видно:
- **Edge Config Store** (`my-config-course-health`) - это и есть Vercel KV! Но он ограничен по функциональности
- **Redis** (Serverless Redis) - полноценный Redis
- **Upstash** (Serverless DB Redis) - тоже Redis, но с лучшей интеграцией

## Рекомендация: Использовать Upstash Redis

Upstash лучше подходит для нашего проекта, так как:
- Полная совместимость с Redis
- Хорошая интеграция с Vercel
- Бесплатный тариф достаточен для начала

## Шаги настройки:

### 1. Создать Upstash Redis

1. В Vercel Dashboard → **Storage** → **Create Database**
2. В списке выберите **"Upstash"** (Serverless DB Redis)
3. Нажмите **"Continue"**
4. Назовите базу: `course-health-redis`
5. Выберите регион
6. Выберите план (Free для начала)
7. Создайте базу

### 2. Подключить проект

1. В созданной Upstash базе нажмите **"Connect Project"**
2. Выберите проект `course-sport`
3. Выберите окружения: Development, Preview, Production
4. Environment Variable: `UPSTASH_REDIS_REST_URL` (автоматически)
5. Token: `UPSTASH_REDIS_REST_TOKEN` (автоматически)
6. Нажмите **"Connect"**

### 3. Переменные окружения

После подключения в проекте появятся:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Их можно использовать напрямую в коде.

## Альтернатива: Использовать Edge Config Store (уже создан)

Если хотите использовать уже созданный `my-config-course-health`:
- Это и есть Vercel KV
- Но он более ограничен, чем Redis
- Для простых key-value операций подойдет

## Что нужно изменить в коде:

1. Заменить `@vercel/kv` на `@upstash/redis`
2. Обновить `lib/vercel/kv.ts` для работы с Upstash
3. Обновить переменные окружения
