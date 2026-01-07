'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, TrendingUp, Zap, Users, Download, Copy, Check } from 'lucide-react'

interface MacroResults {
  bmr: number
  tdee: number
  targetCalories: number
  fats: number
  proteins: number
  carbs: number
  fatsCal: number
  proteinsCal: number
  carbsCal: number
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: { value: 1.2, label: 'Сидячий образ жизни (мало движения)' },
  light: { value: 1.375, label: 'Легкая активность (1-3 тренировки/неделю)' },
  moderate: { value: 1.55, label: 'Умеренная активность (3-5 тренировок/неделю)' },
  active: { value: 1.725, label: 'Высокая активность (6-7 тренировок/неделю)' },
  veryActive: { value: 1.9, label: 'Очень высокая активность (2+ раза в день)' }
}

export function MacroCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [activityLevel, setActivityLevel] = useState<keyof typeof ACTIVITY_MULTIPLIERS>('moderate')
  const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>('cut')
  const [results, setResults] = useState<MacroResults | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const calculateMacros = () => {
    const ageNum = parseFloat(age)
    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height)

    if (!ageNum || !weightNum || !heightNum) {
      return
    }

    // Формула Миффлина-Сан Жеора (BMR)
    let bmr: number
    if (gender === 'male') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161
    }

    // TDEE (Total Daily Energy Expenditure)
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel].value)

    // Целевые калории в зависимости от цели
    let targetCalories: number
    if (goal === 'cut') {
      targetCalories = Math.round(tdee * 0.85) // Дефицит 15%
    } else if (goal === 'bulk') {
      targetCalories = Math.round(tdee * 1.1) // Профицит 10%
    } else {
      targetCalories = tdee
    }

    // Распределение макросов для кето
    const fatsPercent = 0.725 // 72.5% (среднее между 70-75%)
    const proteinsPercent = 0.225 // 22.5% (среднее между 20-25%)
    const carbsPercent = 0.05 // 5%

    const fatsCal = Math.round(targetCalories * fatsPercent)
    const proteinsCal = Math.round(targetCalories * proteinsPercent)
    const carbsCal = Math.round(targetCalories * carbsPercent)

    // Переводим калории в граммы (1г жира = 9 ккал, 1г белка = 4 ккал, 1г углеводов = 4 ккал)
    const fats = Math.round(fatsCal / 9)
    const proteins = Math.round(proteinsCal / 4)
    const carbs = Math.round(carbsCal / 4)

    setResults({
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      fats,
      proteins,
      carbs,
      fatsCal,
      proteinsCal,
      carbsCal
    })
  }

  const copyResults = () => {
    if (!results) return
    
    const goalText = goal === 'cut' ? 'Сброс веса' : goal === 'maintain' ? 'Поддержание' : 'Набор массы'
    const activityText = ACTIVITY_MULTIPLIERS[activityLevel].label
    
    const text = `📊 РАСЧЕТ КАЛОРИЙ И МАКРОСОВ (КЕТО)

👤 Параметры:
Пол: ${gender === 'male' ? 'Мужской' : 'Женский'}
Возраст: ${age} лет
Вес: ${weight} кг
Рост: ${height} см
Уровень активности: ${activityText}
Цель: ${goalText}

📈 Результаты:
BMR (базовый метаболизм): ${results.bmr} ккал/день
TDEE (расход калорий): ${results.tdee} ккал/день
Целевые калории: ${results.targetCalories} ккал/день

🥑 Распределение макросов:
Жиры: ${results.fats}г / ${results.fatsCal} ккал (70-75%)
Белки: ${results.proteins}г / ${results.proteinsCal} ккал (20-25%)
Углеводы: ${results.carbs}г / ${results.carbsCal} ккал (5-10%)

Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    if (!results) return
    
    try {
      setDownloading(true)
      
      const goalText = goal === 'cut' ? 'Сброс веса' : goal === 'maintain' ? 'Поддержание' : 'Набор массы'
      
      // Создаем временный HTML элемент для рендеринга
      const printContent = document.createElement('div')
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '210mm' // A4 width
      printContent.style.padding = '20mm'
      printContent.style.backgroundColor = '#ffffff'
      printContent.style.fontFamily = 'Arial, sans-serif'
      printContent.style.color = '#000000'
      
      printContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #f59e0b;">Расчет калорий и макросов (Кето)</h1>
          <p style="font-size: 12px; color: #999;">Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; color: #10b981; margin: 0 0 15px 0; border-bottom: 2px solid #10b981; padding-bottom: 5px;">Параметры:</h2>
          <div style="margin-left: 15px;">
            <p style="margin: 8px 0;"><strong>Пол:</strong> ${gender === 'male' ? 'Мужской' : 'Женский'}</p>
            <p style="margin: 8px 0;"><strong>Возраст:</strong> ${age} лет</p>
            <p style="margin: 8px 0;"><strong>Вес:</strong> ${weight} кг</p>
            <p style="margin: 8px 0;"><strong>Рост:</strong> ${height} см</p>
            <p style="margin: 8px 0;"><strong>Уровень активности:</strong> ${ACTIVITY_MULTIPLIERS[activityLevel].label}</p>
            <p style="margin: 8px 0;"><strong>Цель:</strong> ${goalText}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; color: #f59e0b; margin: 0 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">Основные показатели:</h2>
          <div style="margin-left: 15px;">
            <p style="margin: 8px 0;">BMR (базовый метаболизм): <strong>${results.bmr} ккал/день</strong></p>
            <p style="margin: 8px 0;">TDEE (расход калорий): <strong>${results.tdee} ккал/день</strong></p>
            <p style="margin: 8px 0; color: #10b981; font-size: 16px; font-weight: bold;">Целевые калории: ${results.targetCalories} ккал/день</p>
          </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; color: #f59e0b; margin: 0 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">Распределение макросов (Кето):</h2>
          <div style="margin-left: 15px;">
            <p style="margin: 8px 0;">Жиры: <strong>${results.fats}г</strong> / ${results.fatsCal} ккал (70-75%)</p>
            <p style="margin: 8px 0;">Белки: <strong>${results.proteins}г</strong> / ${results.proteinsCal} ккал (20-25%)</p>
            <p style="margin: 8px 0;">Углеводы: <strong>${results.carbs}г</strong> / ${results.carbsCal} ккал (5-10%)</p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; font-style: italic; color: #666;">
          Рекомендация: Следуйте этим показателям для достижения кетоза
        </div>
      `
      
      document.body.appendChild(printContent)
      
      // Используем html2canvas для создания изображения
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      // Удаляем временный элемент
      document.body.removeChild(printContent)
      
      // Конвертируем canvas в изображение и добавляем в PDF
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      const fileName = `Кето-макросы-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)
      
      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-gold/10 via-dark-800/50 to-accent-electric/10 border-2 border-accent-gold/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center">
          <Calculator className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Калькулятор калорий и макросов</h3>
          <p className="text-white/60 text-sm">Рассчитайте свои индивидуальные показатели</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Пол */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Пол
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setGender('male')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                gender === 'male'
                  ? 'bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 shadow-lg shadow-accent-teal/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Мужской
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                gender === 'female'
                  ? 'bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 shadow-lg shadow-accent-teal/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Женский
            </button>
          </div>
        </div>

        {/* Возраст */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Возраст (лет)</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-teal/50 focus:ring-2 focus:ring-accent-teal/20 transition-all"
          />
        </div>

        {/* Вес */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Вес (кг)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-teal/50 focus:ring-2 focus:ring-accent-teal/20 transition-all"
          />
        </div>

        {/* Рост */}
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">Рост (см)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-teal/50 focus:ring-2 focus:ring-accent-teal/20 transition-all"
          />
        </div>

        {/* Уровень активности */}
        <div className="md:col-span-2">
          <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Уровень активности
          </label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as keyof typeof ACTIVITY_MULTIPLIERS)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-teal/50 focus:ring-2 focus:ring-accent-teal/20 transition-all"
          >
            {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, { label }]) => (
              <option key={key} value={key} className="bg-dark-800">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Цель */}
        <div className="md:col-span-2">
          <label className="block text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Цель
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setGoal('cut')}
              className={`py-3 rounded-xl font-medium transition-all ${
                goal === 'cut'
                  ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/50 text-white shadow-lg shadow-red-500/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              Сброс веса
            </button>
            <button
              onClick={() => setGoal('maintain')}
              className={`py-3 rounded-xl font-medium transition-all ${
                goal === 'maintain'
                  ? 'bg-gradient-to-r from-accent-teal/20 to-accent-mint/20 border-2 border-accent-teal/50 text-white shadow-lg shadow-accent-teal/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              Поддержание
            </button>
            <button
              onClick={() => setGoal('bulk')}
              className={`py-3 rounded-xl font-medium transition-all ${
                goal === 'bulk'
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-2 border-blue-500/50 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              Набор массы
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={calculateMacros}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-teal to-accent-mint text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-accent-teal/30 transition-all mb-6"
      >
        Рассчитать
      </button>

      {results && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Основные показатели */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-white/60 text-sm mb-1">BMR (базовый метаболизм)</div>
              <div className="text-2xl font-bold text-accent-gold">{results.bmr}</div>
              <div className="text-white/40 text-xs">ккал/день</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-white/60 text-sm mb-1">TDEE (расход калорий)</div>
              <div className="text-2xl font-bold text-accent-electric">{results.tdee}</div>
              <div className="text-white/40 text-xs">ккал/день</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-accent-mint/20 to-accent-teal/20 border-2 border-accent-mint/30">
              <div className="text-white/80 text-sm mb-1 font-medium">Целевые калории</div>
              <div className="text-2xl font-bold text-white">{results.targetCalories}</div>
              <div className="text-white/60 text-xs">ккал/день</div>
            </div>
          </div>

          {/* Макросы */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border-2 border-accent-gold/30">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-gold" />
              Распределение макросов (Кето)
            </h4>
            <div className="space-y-3">
              {/* Жиры */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 font-medium">Жиры: 70-75%</span>
                  <span className="text-white font-bold">{results.fats}г / {results.fatsCal} ккал</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '72.5%' }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                  />
                </div>
              </div>

              {/* Белки */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 font-medium">Белки: 20-25%</span>
                  <span className="text-white font-bold">{results.proteins}г / {results.proteinsCal} ккал</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '22.5%' }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                  />
                </div>
              </div>

              {/* Углеводы */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 font-medium">Углеводы: 5-10%</span>
                  <span className="text-white font-bold">{results.carbs}г / {results.carbsCal} ккал</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '5%' }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-green-400 to-green-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            <button
              onClick={copyResults}
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-accent-mint" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Скопировать результаты</span>
                </>
              )}
            </button>
            
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="py-3 rounded-xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-gold/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  <span>Генерация PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Скачать PDF</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

