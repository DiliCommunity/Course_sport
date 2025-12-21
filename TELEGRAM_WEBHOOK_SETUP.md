# 🔗 Настройка Telegram Bot Webhook

## ⚠️ Важно: `/setwebhook` - это НЕ команда BotFather!

`/setwebhook` - это метод Telegram Bot API, который нужно вызывать через HTTP запрос, а не через BotFather.

---

## 🚀 Быстрая настройка (3 способа):

### Способ 1: Через скрипт (рекомендуется)

1. **Получите токен бота:**
   - Откройте **@BotFather** в Telegram
   - Отправьте `/mybots`
   - Выберите **@Course_Sport_bot**
   - Выберите **"API Token"**
   - Скопируйте токен

2. **Запустите скрипт:**
   ```bash
   node setup-webhook.js YOUR_BOT_TOKEN https://course-sport.vercel.app/api/telegram/webhook
   ```

   С секретным токеном (опционально):
   ```bash
   node setup-webhook.js YOUR_BOT_TOKEN https://course-sport.vercel.app/api/telegram/webhook YOUR_SECRET_TOKEN
   ```

---

### Способ 2: Через curl (в терминале)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://course-sport.vercel.app/api/telegram/webhook"
  }'
```

**С секретным токеном:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://course-sport.vercel.app/api/telegram/webhook",
    "secret_token": "your_secret_token_here"
  }'
```

**Замените:**
- `<YOUR_BOT_TOKEN>` - на ваш токен из BotFather
- `your_secret_token_here` - на случайную строку (опционально, для безопасности)

---

### Способ 3: Через браузер (самый простой)

1. Откройте в браузере (замените `YOUR_BOT_TOKEN` на реальный токен):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://course-sport.vercel.app/api/telegram/webhook
   ```

2. Должен вернуться JSON:
   ```json
   {"ok":true,"result":true,"description":"Webhook was set"}
   ```

---

## ✅ Проверка webhook:

После настройки проверьте, что webhook установлен:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Или в браузере:**
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

**Ожидаемый ответ:**
```json
{
  "ok": true,
  "result": {
    "url": "https://course-sport.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## 🔒 Безопасность (опционально):

Для дополнительной безопасности можно использовать `secret_token`:

1. **Сгенерируйте случайную строку:**
   ```bash
   # В Linux/Mac:
   openssl rand -hex 32
   
   # Или просто придумайте длинную строку
   ```

2. **Добавьте в Vercel:**
   - Name: `TELEGRAM_WEBHOOK_SECRET`
   - Value: ваша случайная строка
   - Environment: Production, Preview, Development

3. **Настройте webhook с секретом:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://course-sport.vercel.app/api/telegram/webhook",
       "secret_token": "your_generated_secret"
     }'
   ```

---

## 📋 Чек-лист настройки:

- [ ] Получен токен бота из BotFather
- [ ] Добавлен `TELEGRAM_BOT_TOKEN` в Vercel Environment Variables
- [ ] Добавлен `NEXT_PUBLIC_SITE_URL` в Vercel (если еще нет)
- [ ] Webhook настроен через API (curl/скрипт/браузер)
- [ ] Webhook проверен через `getWebhookInfo`
- [ ] Сделан redeploy на Vercel
- [ ] Протестирована команда `/start` в боте

---

## 🐛 Решение проблем:

### Ошибка: "Bad Request: HTTPS url must be provided"
- Убедитесь, что URL начинается с `https://`
- Локальный `http://localhost` не работает для webhook

### Ошибка: "Bad Request: url is empty"
- Проверьте, что URL правильно указан в запросе
- Убедитесь, что нет лишних пробелов

### Ошибка: "Unauthorized" в логах Vercel
- Проверьте, что `TELEGRAM_WEBHOOK_SECRET` совпадает в Vercel и в webhook
- Или уберите проверку секрета из кода (не рекомендуется для продакшена)

### Webhook не получает обновления
- Проверьте, что URL доступен публично (не localhost)
- Проверьте логи Vercel на наличие ошибок
- Убедитесь, что проект задеплоен на Vercel

---

## 🎯 После настройки:

1. Откройте бота **@Course_Sport_bot** в Telegram
2. Отправьте команду `/start`
3. Должно прийти приветственное сообщение с фото и кнопками!

---

## 📞 Полезные команды:

**Удалить webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

**Получить информацию о webhook:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Отправить тестовое сообщение (для проверки токена):**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```
