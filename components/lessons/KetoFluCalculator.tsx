'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Droplet, AlertTriangle, CheckCircle2, Copy, Check, Download } from 'lucide-react'

interface Symptom {
  id: string
  name: string
  checked: boolean
  severity: 'mild' | 'moderate' | 'severe'
}

const SYMPTOMS: Symptom[] = [
  { id: 'headache', name: 'Головная боль', checked: false, severity: 'moderate' },
  { id: 'fatigue', name: 'Усталость', checked: false, severity: 'moderate' },
  { id: 'irritability', name: 'Раздражительность', checked: false, severity: 'mild' },
  { id: 'brain_fog', name: 'Туман в голове', checked: false, severity: 'moderate' },
  { id: 'dizziness', name: 'Головокружение', checked: false, severity: 'moderate' },
  { id: 'nausea', name: 'Тошнота', checked: false, severity: 'severe' },
  { id: 'muscle_cramps', name: 'Мышечные судороги', checked: false, severity: 'moderate' },
  { id: 'constipation', name: 'Запор', checked: false, severity: 'mild' },
]

export function KetoFluCalculator() {
  const [symptoms, setSymptoms] = useState<Symptom[]>(SYMPTOMS)
  const [water, setWater] = useState('1')
  const [salt, setSalt] = useState('0.5')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const toggleSymptom = (id: string) => {
    setSymptoms(symptoms.map(s => 
      s.id === id ? { ...s, checked: !s.checked } : s
    ))
  }

  const getSeverityCount = () => {
    const checked = symptoms.filter(s => s.checked)
    const severe = checked.filter(s => s.severity === 'severe').length
    const moderate = checked.filter(s => s.severity === 'moderate').length
    const mild = checked.filter(s => s.severity === 'mild').length
    
    return { total: checked.length, severe, moderate, mild }
  }

  const getRecommendations = () => {
    const checkedSymptoms = symptoms.filter(s => s.checked)
    const recommendations: string[] = []
    
    if (checkedSymptoms.some(s => ['headache', 'dizziness', 'fatigue'].includes(s.id))) {
      recommendations.push('Увеличьте потребление соли и воды')
      recommendations.push('Добавьте электролиты (магний, калий)')
    }
    
    if (checkedSymptoms.some(s => ['muscle_cramps'].includes(s.id))) {
      recommendations.push('Примите добавку магния (400-600мг)')
      recommendations.push('Увеличьте потребление калия')
    }
    
    if (checkedSymptoms.some(s => ['nausea', 'constipation'].includes(s.id))) {
      recommendations.push('Увеличьте потребление жиров')
      recommendations.push('Пейте больше воды между приемами пищи')
    }
    
    if (checkedSymptoms.some(s => ['brain_fog', 'irritability'].includes(s.id))) {
      recommendations.push('Обеспечьте достаточный сон (7-9 часов)')
      recommendations.push('Снизьте физические нагрузки на 2-3 дня')
    }
    
    if (recommendations.length === 0 && checkedSymptoms.length > 0) {
      recommendations.push('Увеличьте потребление воды и электролитов')
      recommendations.push('Обеспечьте достаточный сон')
    }
    
    return recommendations
  }

  const calculateElectrolyte = () => {
    const waterAmount = parseFloat(water) || 1
    const saltAmount = parseFloat(salt) || 0.5
    
    return {
      water: waterAmount,
      salt: saltAmount,
      saltGrams: saltAmount * 5, // 1 ч.л. ≈ 5г соли
      sodium: Math.round(saltAmount * 2300), // примерно 2300мг натрия в 1 ч.л. соли
      servings: Math.ceil(waterAmount / 0.3) // примерно 300мл на порцию
    }
  }

  const copyRecipe = () => {
    const recipe = calculateElectrolyte()
    const text = `Рецепт кето-электролита:
${recipe.water}л воды
${recipe.salt} ч.л. соли
Сок 1/2 лимона
Стевия по вкусу

Содержание натрия: ~${recipe.sodium}мг
Рекомендуется: ${recipe.servings} порций в день`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const severityCount = getSeverityCount()
  const recommendations = getRecommendations()
  const electrolyte = calculateElectrolyte()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-dark-800/50 to-red-500/10 border-2 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Трекер кетогриппа</h3>
          <p className="text-white/60 text-sm">Отслеживание симптомов и получение рекомендаций</p>
        </div>
      </div>

      {/* Симптомы */}
      <div className="mb-6">
        <h4 className="text-white font-semibold mb-3">Отметьте ваши симптомы:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {symptoms.map((symptom) => (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                symptom.checked
                  ? symptom.severity === 'severe'
                    ? 'bg-red-500/20 border-red-500/50 text-white'
                    : symptom.severity === 'moderate'
                    ? 'bg-amber-500/20 border-amber-500/50 text-white'
                    : 'bg-yellow-500/20 border-yellow-500/50 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {symptom.checked ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-current flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{symptom.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Статистика */}
      {severityCount.total > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-4 text-sm">
            <div>
              <div className="text-white/60">Всего симптомов:</div>
              <div className="text-2xl font-bold text-white">{severityCount.total}</div>
            </div>
            {severityCount.severe > 0 && (
              <div>
                <div className="text-red-400/60">Серьезных:</div>
                <div className="text-xl font-bold text-red-400">{severityCount.severe}</div>
              </div>
            )}
            {severityCount.moderate > 0 && (
              <div>
                <div className="text-amber-400/60">Умеренных:</div>
                <div className="text-xl font-bold text-amber-400">{severityCount.moderate}</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-br from-accent-mint/20 to-accent-teal/20 border-2 border-accent-mint/30"
        >
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent-mint" />
            Рекомендации:
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-accent-mint mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Калькулятор электролитов */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Droplet className="w-5 h-5 text-blue-400" />
          <h4 className="text-white font-semibold">Рецепт кето-электролита</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-white/60 text-xs mb-1">Вода (л)</label>
            <input
              type="number"
              step="0.5"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1">Соль (ч.л.)</label>
            <input
              type="number"
              step="0.5"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50"
            />
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xs text-white/60 mb-2">Рецепт:</div>
          <div className="text-white text-sm space-y-1">
            <div>{electrolyte.water}л воды</div>
            <div>{electrolyte.salt} ч.л. соли (~{electrolyte.saltGrams}г)</div>
            <div>Сок 1/2 лимона</div>
            <div>Стевия по вкусу</div>
            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
              Натрий: ~{electrolyte.sodium}мг | Рекомендуется: {electrolyte.servings} порций в день
            </div>
          </div>
        </div>

        <button
          onClick={copyRecipe}
          className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span>Рецепт скопирован!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Скопировать рецепт</span>
            </>
          )}
        </button>
      </div>

      {/* Кнопка скачивания PDF */}
      {(severityCount.total > 0 || recommendations.length > 0) && (
        <button
          onClick={async () => {
            try {
              setDownloading(true)
              
              const checkedSymptoms = symptoms.filter(s => s.checked)
              
              // Создаем временный HTML элемент для рендеринга
              const printContent = document.createElement('div')
              printContent.style.position = 'absolute'
              printContent.style.left = '-9999px'
              printContent.style.width = '210mm' // A4 width
              printContent.style.padding = '20mm'
              printContent.style.backgroundColor = '#ffffff'
              printContent.style.fontFamily = 'Arial, sans-serif'
              printContent.style.color = '#000000'
              
              let symptomsHtml = ''
              if (checkedSymptoms.length > 0) {
                symptomsHtml = `
                  <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; color: #f59e0b; margin: 0 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">Ваши симптомы:</h2>
                    <div style="margin-left: 15px;">
                      ${checkedSymptoms.map(s => {
                        const severityText = s.severity === 'severe' ? 'Серьезный' : s.severity === 'moderate' ? 'Умеренный' : 'Легкий'
                        return `<p style="margin: 8px 0;">• ${s.name} <span style="color: #666;">(${severityText})</span></p>`
                      }).join('')}
                    </div>
                  </div>
                `
              }
              
              let statsHtml = ''
              if (severityCount.total > 0) {
                statsHtml = `
                  <div style="margin-bottom: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
                    <p style="margin: 5px 0;"><strong>Всего симптомов:</strong> ${severityCount.total}</p>
                    ${severityCount.severe > 0 ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Серьезных:</strong> ${severityCount.severe}</p>` : ''}
                    ${severityCount.moderate > 0 ? `<p style="margin: 5px 0; color: #f59e0b;"><strong>Умеренных:</strong> ${severityCount.moderate}</p>` : ''}
                  </div>
                `
              }
              
              let recommendationsHtml = ''
              if (recommendations.length > 0) {
                recommendationsHtml = `
                  <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 16px; color: #10b981; margin: 0 0 15px 0; border-bottom: 2px solid #10b981; padding-bottom: 5px;">Рекомендации:</h2>
                    <div style="margin-left: 15px;">
                      ${recommendations.map(rec => `<p style="margin: 8px 0;">• ${rec}</p>`).join('')}
                    </div>
                  </div>
                `
              }
              
              printContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #f59e0b;">Трекер кетогриппа</h1>
                  <p style="font-size: 12px; color: #999;">Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}</p>
                </div>
                ${symptomsHtml}
                ${statsHtml}
                ${recommendationsHtml}
                <div style="margin-top: 20px;">
                  <h2 style="font-size: 16px; color: #3b82f6; margin: 0 0 15px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">Рецепт кето-электролита:</h2>
                  <div style="margin-left: 15px;">
                    <p style="margin: 8px 0;">${electrolyte.water}л воды</p>
                    <p style="margin: 8px 0;">${electrolyte.salt} ч.л. соли (~${electrolyte.saltGrams}г)</p>
                    <p style="margin: 8px 0;">Сок 1/2 лимона</p>
                    <p style="margin: 8px 0;">Стевия по вкусу</p>
                    <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">Натрий: ~${electrolyte.sodium}мг | Рекомендуется: ${electrolyte.servings} порций в день</p>
                  </div>
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
              
              const fileName = `Кетогрипп-трекер-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
              pdf.save(fileName)
              
              setDownloading(false)
            } catch (error) {
              console.error('Error generating PDF:', error)
              setDownloading(false)
              alert('Не удалось создать PDF файл. Попробуйте еще раз.')
            }
          }}
          disabled={downloading}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-white font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Генерация PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Скачать отчет в PDF</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}

