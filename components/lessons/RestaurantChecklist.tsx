'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UtensilsCrossed, Copy, Check, Download, MapPin, Languages, Globe } from 'lucide-react'

type Language = 'ru' | 'en' | 'fr' | 'it' | 'es'

interface RestaurantType {
  id: string
  name: string
  nameTranslations: Record<Language, string>
  icon: string
  phrases: Record<Language, string[]>
  dishes: Record<Language, string[]>
}

const LANGUAGE_NAMES: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español'
}

const RESTAURANT_TYPES: RestaurantType[] = [
  {
    id: 'italian',
    name: 'Итальянский',
    nameTranslations: {
      ru: 'Итальянский',
      en: 'Italian',
      fr: 'Italien',
      it: 'Italiano',
      es: 'Italiano'
    },
    icon: '🍝',
    phrases: {
      ru: [
        'Можно без пасты, только мясо и овощи?',
        'Есть ли блюда без глютена?',
        'Можно заменить гарнир на овощи?',
        'Без хлеба, пожалуйста'
      ],
      en: [
        'Can I have it without pasta, just meat and vegetables?',
        'Do you have gluten-free dishes?',
        'Can I replace the side dish with vegetables?',
        'No bread, please'
      ],
      fr: [
        'Puis-je l\'avoir sans pâtes, juste de la viande et des légumes?',
        'Avez-vous des plats sans gluten?',
        'Puis-je remplacer le plat d\'accompagnement par des légumes?',
        'Sans pain, s\'il vous plaît'
      ],
      it: [
        'Posso averlo senza pasta, solo carne e verdure?',
        'Avete piatti senza glutine?',
        'Posso sostituire il contorno con verdure?',
        'Senza pane, per favore'
      ],
      es: [
        '¿Puedo tenerlo sin pasta, solo carne y verduras?',
        '¿Tienen platos sin gluten?',
        '¿Puedo reemplazar la guarnición con verduras?',
        'Sin pan, por favor'
      ]
    },
    dishes: {
      ru: [
        'Салат Цезарь (без сухариков)',
        'Стейк с овощами',
        'Курица гриль',
        'Морепродукты',
        'Сырная тарелка',
        'Овощи на гриле'
      ],
      en: [
        'Caesar Salad (no croutons)',
        'Steak with vegetables',
        'Grilled chicken',
        'Seafood',
        'Cheese plate',
        'Grilled vegetables'
      ],
      fr: [
        'Salade César (sans croûtons)',
        'Steak aux légumes',
        'Poulet grillé',
        'Fruits de mer',
        'Assiette de fromages',
        'Légumes grillés'
      ],
      it: [
        'Insalata Cesare (senza crostini)',
        'Bistecca con verdure',
        'Pollo alla griglia',
        'Frutti di mare',
        'Tagliere di formaggi',
        'Verdure alla griglia'
      ],
      es: [
        'Ensalada César (sin crutones)',
        'Bistec con verduras',
        'Pollo a la parrilla',
        'Mariscos',
        'Tabla de quesos',
        'Verduras a la parrilla'
      ]
    }
  },
  {
    id: 'asian',
    name: 'Азиатский',
    nameTranslations: {
      ru: 'Азиатский',
      en: 'Asian',
      fr: 'Asiatique',
      it: 'Asiatico',
      es: 'Asiático'
    },
    icon: '🍜',
    phrases: {
      ru: [
        'Можно без риса?',
        'Есть ли блюда без лапши?',
        'Можно без сладких соусов?',
        'Только мясо и овощи, пожалуйста'
      ],
      en: [
        'Can I have it without rice?',
        'Do you have dishes without noodles?',
        'Can I have it without sweet sauces?',
        'Just meat and vegetables, please'
      ],
      fr: [
        'Puis-je l\'avoir sans riz?',
        'Avez-vous des plats sans nouilles?',
        'Puis-je l\'avoir sans sauces sucrées?',
        'Juste de la viande et des légumes, s\'il vous plaît'
      ],
      it: [
        'Posso averlo senza riso?',
        'Avete piatti senza noodles?',
        'Posso averlo senza salse dolci?',
        'Solo carne e verdure, per favore'
      ],
      es: [
        '¿Puedo tenerlo sin arroz?',
        '¿Tienen platos sin fideos?',
        '¿Puedo tenerlo sin salsas dulces?',
        'Solo carne y verduras, por favor'
      ]
    },
    dishes: {
      ru: [
        'Сашими',
        'Терияки (без риса)',
        'Овощи вок',
        'Мясные шашлычки',
        'Рыба на пару',
        'Овощной салат'
      ],
      en: [
        'Sashimi',
        'Teriyaki (no rice)',
        'Wok vegetables',
        'Meat skewers',
        'Steamed fish',
        'Vegetable salad'
      ],
      fr: [
        'Sashimi',
        'Teriyaki (sans riz)',
        'Légumes sautés au wok',
        'Brochettes de viande',
        'Poisson à la vapeur',
        'Salade de légumes'
      ],
      it: [
        'Sashimi',
        'Teriyaki (senza riso)',
        'Verdure saltate in wok',
        'Spiedini di carne',
        'Pesce al vapore',
        'Insalata di verdure'
      ],
      es: [
        'Sashimi',
        'Teriyaki (sin arroz)',
        'Verduras salteadas',
        'Brochetas de carne',
        'Pescado al vapor',
        'Ensalada de verduras'
      ]
    }
  },
  {
    id: 'russian',
    name: 'Русский',
    nameTranslations: {
      ru: 'Русский',
      en: 'Russian',
      fr: 'Russe',
      it: 'Russo',
      es: 'Ruso'
    },
    icon: '🥘',
    phrases: {
      ru: [
        'Можно без картофеля?',
        'Есть ли блюда без круп?',
        'Можно заменить гарнир на овощи?',
        'Только мясо и салат, пожалуйста'
      ],
      en: [
        'Can I have it without potatoes?',
        'Do you have dishes without grains?',
        'Can I replace the side dish with vegetables?',
        'Just meat and salad, please'
      ],
      fr: [
        'Puis-je l\'avoir sans pommes de terre?',
        'Avez-vous des plats sans céréales?',
        'Puis-je remplacer le plat d\'accompagnement par des légumes?',
        'Juste de la viande et de la salade, s\'il vous plaît'
      ],
      it: [
        'Posso averlo senza patate?',
        'Avete piatti senza cereali?',
        'Posso sostituire il contorno con verdure?',
        'Solo carne e insalata, per favore'
      ],
      es: [
        '¿Puedo tenerlo sin papas?',
        '¿Tienen platos sin cereales?',
        '¿Puedo reemplazar la guarnición con verduras?',
        'Solo carne y ensalada, por favor'
      ]
    },
    dishes: {
      ru: [
        'Шашлык',
        'Рыба запеченная',
        'Салат овощной',
        'Мясо на гриле',
        'Сырная тарелка',
        'Овощи на гриле'
      ],
      en: [
        'Shashlik',
        'Baked fish',
        'Vegetable salad',
        'Grilled meat',
        'Cheese plate',
        'Grilled vegetables'
      ],
      fr: [
        'Chachlik',
        'Poisson au four',
        'Salade de légumes',
        'Viande grillée',
        'Assiette de fromages',
        'Légumes grillés'
      ],
      it: [
        'Shashlik',
        'Pesce al forno',
        'Insalata di verdure',
        'Carne alla griglia',
        'Tagliere di formaggi',
        'Verdure alla griglia'
      ],
      es: [
        'Shashlik',
        'Pescado al horno',
        'Ensalada de verduras',
        'Carne a la parrilla',
        'Tabla de quesos',
        'Verduras a la parrilla'
      ]
    }
  },
  {
    id: 'cafe',
    name: 'Кафе',
    nameTranslations: {
      ru: 'Кафе',
      en: 'Cafe',
      fr: 'Café',
      it: 'Caffè',
      es: 'Café'
    },
    icon: '☕',
    phrases: {
      ru: [
        'Есть ли низкоуглеводные блюда?',
        'Можно без хлеба?',
        'Есть ли салаты?',
        'Кофе с жирными сливками, пожалуйста'
      ],
      en: [
        'Do you have low-carb dishes?',
        'Can I have it without bread?',
        'Do you have salads?',
        'Coffee with heavy cream, please'
      ],
      fr: [
        'Avez-vous des plats à faible teneur en glucides?',
        'Puis-je l\'avoir sans pain?',
        'Avez-vous des salades?',
        'Café avec crème épaisse, s\'il vous plaît'
      ],
      it: [
        'Avete piatti a basso contenuto di carboidrati?',
        'Posso averlo senza pane?',
        'Avete insalate?',
        'Caffè con panna, per favore'
      ],
      es: [
        '¿Tienen platos bajos en carbohidratos?',
        '¿Puedo tenerlo sin pan?',
        '¿Tienen ensaladas?',
        'Café con crema espesa, por favor'
      ]
    },
    dishes: {
      ru: [
        'Салат с курицей',
        'Омлет с овощами',
        'Яйца с беконом',
        'Авокадо тост (без хлеба)',
        'Сырная тарелка',
        'Орехи и сыр'
      ],
      en: [
        'Chicken salad',
        'Omelet with vegetables',
        'Eggs with bacon',
        'Avocado toast (no bread)',
        'Cheese plate',
        'Nuts and cheese'
      ],
      fr: [
        'Salade de poulet',
        'Omelette aux légumes',
        'Œufs au bacon',
        'Toast à l\'avocat (sans pain)',
        'Assiette de fromages',
        'Noix et fromage'
      ],
      it: [
        'Insalata di pollo',
        'Omelette con verdure',
        'Uova con pancetta',
        'Toast all\'avocado (senza pane)',
        'Tagliere di formaggi',
        'Noci e formaggio'
      ],
      es: [
        'Ensalada de pollo',
        'Tortilla con verduras',
        'Huevos con tocino',
        'Tostada de aguacate (sin pan)',
        'Tabla de quesos',
        'Nueces y queso'
      ]
    }
  }
]

export function RestaurantChecklist() {
  const [selectedType, setSelectedType] = useState<RestaurantType | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ru')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateText = () => {
    if (!selectedType) return ''
    
    const lang = selectedLanguage
    const phrases = selectedType.phrases[lang]
    const dishes = selectedType.dishes[lang]
    const restaurantName = selectedType.nameTranslations[lang]
    
    let text = `📋 ${lang === 'ru' ? 'ЧЕК-ЛИСТ ДЛЯ РЕСТОРАНА' : lang === 'en' ? 'RESTAURANT CHECKLIST' : lang === 'fr' ? 'LISTE DE VÉRIFICATION RESTAURANT' : lang === 'it' ? 'LISTA DI CONTROLLO RISTORANTE' : 'LISTA DE VERIFICACIÓN RESTAURANTE'}: ${restaurantName}\n\n`
    text += `💬 ${lang === 'ru' ? 'ГОТОВЫЕ ФРАЗЫ' : lang === 'en' ? 'READY PHRASES' : lang === 'fr' ? 'PHRASES PRÊTES' : lang === 'it' ? 'FRASI PRONTE' : 'FRASES LISTAS'}:\n`
    phrases.forEach((phrase, index) => {
      text += `${index + 1}. ${phrase}\n`
    })
    text += `\n🍽️ ${lang === 'ru' ? 'КЕТО-ДРУЖЕЛЮБНЫЕ БЛЮДА' : lang === 'en' ? 'KETO-FRIENDLY DISHES' : lang === 'fr' ? 'PLATS KETO' : lang === 'it' ? 'PIATTI KETO' : 'PLATOS KETO'}:\n`
    dishes.forEach((dish, index) => {
      text += `${index + 1}. ${dish}\n`
    })
    
    return text
  }

  const downloadPDF = async () => {
    if (!selectedType) return

    try {
      setDownloading(true)

      const lang = selectedLanguage
      const phrases = selectedType.phrases[lang]
      const dishes = selectedType.dishes[lang]
      const restaurantName = selectedType.nameTranslations[lang]

      // Создаем красивый HTML элемент с темными стилями
      const printContent = document.createElement('div')
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '50px'
      printContent.style.background = 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #0a0a0b 100%)'
      printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      printContent.style.color = '#ffffff'
      printContent.style.borderRadius = '20px'

      const titleText = lang === 'ru' ? `Чек-лист для ресторана: ${restaurantName}` : 
                       lang === 'en' ? `Restaurant Checklist: ${restaurantName}` :
                       lang === 'fr' ? `Liste de vérification restaurant: ${restaurantName}` :
                       lang === 'it' ? `Lista di controllo ristorante: ${restaurantName}` :
                       `Lista de verificación restaurante: ${restaurantName}`
      const phrasesTitle = lang === 'ru' ? 'Готовые фразы:' :
                          lang === 'en' ? 'Ready Phrases:' :
                          lang === 'fr' ? 'Phrases prêtes:' :
                          lang === 'it' ? 'Frasi pronte:' :
                          'Frases listas:'
      const dishesTitle = lang === 'ru' ? 'Кето-дружелюбные блюда:' :
                         lang === 'en' ? 'Keto-Friendly Dishes:' :
                         lang === 'fr' ? 'Plats Keto:' :
                         lang === 'it' ? 'Piatti Keto:' :
                         'Platos Keto:'

      printContent.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.1);
        ">
          <h1 style="
            font-size: 38px;
            font-weight: bold;
            text-align: center;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #ffd700 0%, #00d4ff 100%);
            color: #ffd700;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.5);
          ">
            ${titleText}
          </h1>
          <p style="text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 16px; margin: 0 0 40px 0; text-transform: uppercase; letter-spacing: 2px;">
            ${new Date().toLocaleDateString('ru-RU')}
          </p>
          
          <div style="margin-bottom: 35px;">
            <h2 style="
              font-size: 24px;
              font-weight: bold;
              color: #ffd700;
              margin: 0 0 20px 0;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              <span style="font-size: 28px;">💬</span>
              ${phrasesTitle}
            </h2>
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 20px;
              backdrop-filter: blur(10px);
            ">
              <ul style="margin: 0; padding-left: 25px; list-style: none; line-height: 2.2;">
                ${phrases.map((phrase, idx) => `
                  <li style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 16px;
                    margin-bottom: 12px;
                    padding-left: 30px;
                    position: relative;
                  ">
                    <span style="
                      position: absolute;
                      left: 0;
                      width: 24px;
                      height: 24px;
                      background: linear-gradient(135deg, #ffd700 0%, #00d4ff 100%);
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #000;
                      font-weight: bold;
                      font-size: 12px;
                      box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
                    ">${idx + 1}</span>
                    ${phrase}
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
          
          <div>
            <h2 style="
              font-size: 24px;
              font-weight: bold;
              color: #00d4ff;
              margin: 0 0 20px 0;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              <span style="font-size: 28px;">🍽️</span>
              ${dishesTitle}
            </h2>
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 20px;
              backdrop-filter: blur(10px);
            ">
              <ul style="margin: 0; padding-left: 25px; list-style: none; line-height: 2.2;">
                ${dishes.map((dish, idx) => `
                  <li style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 16px;
                    margin-bottom: 12px;
                    padding-left: 30px;
                    position: relative;
                  ">
                    <span style="
                      position: absolute;
                      left: 0;
                      width: 24px;
                      height: 24px;
                      background: linear-gradient(135deg, #00d4ff 0%, #10b981 100%);
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #000;
                      font-weight: bold;
                      font-size: 12px;
                      box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
                    ">${idx + 1}</span>
                    ${dish}
                  </li>
                `).join('')}
              </ul>
            </div>
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
        backgroundColor: '#0a0a0b',
        allowTaint: true
      })

      document.body.removeChild(printContent)

      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      const fileName = lang === 'ru' ? `Чек-лист-${restaurantName}-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf` :
                     `Checklist-${restaurantName}-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-gold/10 via-dark-800/50 to-accent-electric/10 border-2 border-accent-gold/30 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-electric flex items-center justify-center shadow-lg shadow-accent-gold/30">
          <UtensilsCrossed className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">Чек-лист для ресторанов</h3>
          <p className="text-white/60 text-sm">Готовые фразы и списки блюд для разных типов ресторанов</p>
        </div>
      </div>

      {/* Выбор типа ресторана */}
      <div className="mb-6">
        <label className="block text-white/80 font-medium mb-3">Выберите тип ресторана:</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RESTAURANT_TYPES.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setSelectedType(type)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedType?.id === type.id
                  ? 'bg-gradient-to-r from-accent-gold to-accent-electric border-accent-gold text-dark-900 shadow-lg shadow-accent-gold/30'
                  : 'bg-white/5 border-white/10 text-white hover:border-accent-gold/30 hover:bg-white/10'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-medium text-sm">{type.name}</div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Переключатель языка */}
      {selectedType && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-accent-gold" />
            <label className="block text-white/80 font-medium">Язык фраз:</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LANGUAGE_NAMES) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLanguage === lang
                    ? 'bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 shadow-lg shadow-accent-gold/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                {LANGUAGE_NAMES[lang]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Контент выбранного ресторана */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Готовые фразы */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-accent-gold/10 via-white/5 to-accent-electric/10 border-2 border-accent-gold/30 shadow-lg shadow-accent-gold/10">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-accent-gold" />
              <h4 className="text-lg font-semibold text-white">Готовые фразы для заказа:</h4>
              <span className="ml-auto px-2 py-1 rounded-lg bg-accent-gold/20 text-accent-gold text-xs font-medium">
                {LANGUAGE_NAMES[selectedLanguage]}
              </span>
            </div>
            <div className="space-y-3">
              {selectedType.phrases[selectedLanguage].map((phrase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                  <span className="text-accent-gold font-bold mt-0.5 flex-shrink-0">{index + 1}.</span>
                  <p className="text-white/90 flex-1 leading-relaxed">{phrase}</p>
                  <button
                    onClick={() => copyToClipboard(phrase)}
                    className="p-2 rounded-lg hover:bg-accent-gold/20 transition-colors flex-shrink-0"
                    title="Скопировать"
                  >
                    <Copy className="w-4 h-4 text-white/60 hover:text-accent-gold transition-colors" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Кето-дружелюбные блюда */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-accent-electric/10 via-white/5 to-accent-teal/10 border-2 border-accent-electric/30 shadow-lg shadow-accent-electric/10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-accent-electric" />
              <h4 className="text-lg font-semibold text-white">Кето-дружелюбные блюда:</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedType.dishes[selectedLanguage].map((dish, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <Check className="w-4 h-4 text-accent-mint flex-shrink-0" />
                  <span className="text-white/90 text-sm">{dish}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard(generateText())}
              className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-accent-mint" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать весь чек-лист</span>
                </>
              )}
            </button>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
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

