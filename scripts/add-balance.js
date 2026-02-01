/**
 * Скрипт для начисления баланса пользователю
 * Использование: node scripts/add-balance.js <username> <amount>
 * Пример: node scripts/add-balance.js Garry11 2000
 * 
 * Требует переменные окружения:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

// Загружаем переменные окружения из .env.local если доступен dotenv
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: '.env.local' })
} catch (e) {
  // dotenv не установлен, используем переменные окружения напрямую
  console.log('ℹ️  dotenv не установлен, используем переменные окружения системы')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Ошибка: Необходимо настроить переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addBalance(username, amount) {
  try {
    console.log(`🔍 Поиск пользователя: ${username}...`)
    
    // Находим пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, name')
      .ilike('username', username)
      .maybeSingle()

    if (userError || !user) {
      console.error(`❌ Пользователь с username "${username}" не найден`)
      process.exit(1)
    }

    console.log(`✅ Пользователь найден: ${user.name || user.username} (ID: ${user.id})`)

    const amountInKopecks = Math.round(parseFloat(amount) * 100)
    const amountInRubles = amountInKopecks / 100

    console.log(`💰 Начисление баланса: ${amountInRubles.toLocaleString('ru-RU')} ₽`)

    // Получаем текущий баланс
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balance')
      .select('balance, total_earned')
      .eq('user_id', user.id)
      .maybeSingle()

    const currentBalance = balanceData?.balance || 0
    const currentTotalEarned = balanceData?.total_earned || 0

    // Обновляем или создаем баланс
    if (balanceData) {
      const { error: updateError } = await supabase
        .from('user_balance')
        .update({
          balance: currentBalance + amountInKopecks,
          total_earned: currentTotalEarned + amountInKopecks,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('❌ Ошибка обновления баланса:', updateError)
        process.exit(1)
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_balance')
        .insert({
          user_id: user.id,
          balance: amountInKopecks,
          total_earned: amountInKopecks,
          total_withdrawn: 0
        })

      if (insertError) {
        console.error('❌ Ошибка создания баланса:', insertError)
        process.exit(1)
      }
    }

    // Создаем транзакцию
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'earned',
        amount: amountInKopecks,
        description: `Начисление баланса администратором: ${amountInRubles.toLocaleString('ru-RU')} ₽`,
        reference_type: 'admin_balance_add'
      })

    if (transactionError) {
      console.warn('⚠️  Ошибка создания транзакции (баланс обновлен):', transactionError)
    }

    const newBalance = (currentBalance + amountInKopecks) / 100

    console.log('\n✅ Баланс успешно начислен!')
    console.log(`   Пользователь: ${user.name || user.username}`)
    console.log(`   Начислено: ${amountInRubles.toLocaleString('ru-RU')} ₽`)
    console.log(`   Новый баланс: ${newBalance.toLocaleString('ru-RU')} ₽`)

  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('❌ Использование: node scripts/add-balance.js <username> <amount>')
  console.error('   Пример: node scripts/add-balance.js Garry11 2000')
  process.exit(1)
}

const [username, amount] = args

if (!username || !amount) {
  console.error('❌ Необходимо указать username и amount')
  process.exit(1)
}

addBalance(username, amount)

