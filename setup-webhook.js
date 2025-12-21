#!/usr/bin/env node

/**
 * Скрипт для настройки Telegram Bot Webhook
 * 
 * Использование:
 * node setup-webhook.js <BOT_TOKEN> <WEBHOOK_URL> [SECRET_TOKEN]
 * 
 * Пример:
 * node setup-webhook.js 123456:ABC-DEF... https://course-sport.vercel.app/api/telegram/webhook my_secret_token
 */

const [botToken, webhookUrl, secretToken] = process.argv.slice(2);

if (!botToken || !webhookUrl) {
  console.error('❌ Ошибка: Необходимы токен бота и URL webhook');
  console.log('\nИспользование:');
  console.log('  node setup-webhook.js <BOT_TOKEN> <WEBHOOK_URL> [SECRET_TOKEN]');
  console.log('\nПример:');
  console.log('  node setup-webhook.js 123456:ABC-DEF... https://course-sport.vercel.app/api/telegram/webhook');
  process.exit(1);
}

async function setWebhook() {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  
  const payload = {
    url: webhookUrl,
  };

  if (secretToken) {
    payload.secret_token = secretToken;
  }

  try {
    console.log('🔄 Настройка webhook...');
    console.log(`   URL: ${webhookUrl}`);
    if (secretToken) {
      console.log(`   Secret Token: ${secretToken.substring(0, 10)}...`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook успешно настроен!');
      console.log(`   Описание: ${data.description || 'OK'}`);
      
      // Проверяем информацию о webhook
      const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const infoData = await infoResponse.json();
      
      if (infoData.ok) {
        console.log('\n📋 Информация о webhook:');
        console.log(`   URL: ${infoData.result.url}`);
        console.log(`   Ожидает обновления: ${infoData.result.pending_update_count || 0}`);
        if (infoData.result.last_error_date) {
          console.log(`   ⚠️  Последняя ошибка: ${new Date(infoData.result.last_error_date * 1000).toLocaleString()}`);
          console.log(`   Сообщение: ${infoData.result.last_error_message}`);
        } else {
          console.log('   ✅ Ошибок нет');
        }
      }
    } else {
      console.error('❌ Ошибка настройки webhook:');
      console.error(`   ${data.description || data.error_code}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Ошибка при запросе:', error.message);
    process.exit(1);
  }
}

setWebhook();
