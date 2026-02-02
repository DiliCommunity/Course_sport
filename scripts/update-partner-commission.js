/**
 * Скрипт для обновления комиссии партнёров с 15% на 10%
 * 
 * Использование:
 * node scripts/update-partner-commission.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Ошибка: Не найдены переменные окружения SUPABASE')
  console.error('Убедитесь, что файл .env.local содержит:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updatePartnerCommissions() {
  try {
    console.log('🔄 Начинаю обновление комиссий партнёров...\n')

    // Находим всех партнёров с комиссией 15%
    const { data: partners, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, referral_commission_percent')
      .eq('is_referral_partner', true)
      .eq('referral_commission_percent', 15)

    if (fetchError) {
      console.error('❌ Ошибка при получении партнёров:', fetchError)
      process.exit(1)
    }

    if (!partners || partners.length === 0) {
      console.log('✅ Партнёров с комиссией 15% не найдено. Всё уже обновлено!')
      return
    }

    console.log(`📊 Найдено партнёров с комиссией 15%: ${partners.length}\n`)

    // Обновляем всех на 10%
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ referral_commission_percent: 10 })
      .eq('is_referral_partner', true)
      .eq('referral_commission_percent', 15)
      .select('id, name, email')

    if (updateError) {
      console.error('❌ Ошибка при обновлении:', updateError)
      process.exit(1)
    }

    console.log('✅ Успешно обновлено партнёров:', updated?.length || 0)
    console.log('\n📋 Обновлённые партнёры:')
    updated?.forEach((partner, index) => {
      console.log(`  ${index + 1}. ${partner.name || partner.email || partner.id} (ID: ${partner.id})`)
    })

    console.log('\n✨ Готово! Все партнёры теперь имеют комиссию 10%')

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error)
    process.exit(1)
  }
}

updatePartnerCommissions()

