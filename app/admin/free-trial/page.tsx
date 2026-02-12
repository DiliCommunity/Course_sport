'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  Gift, Loader2, Save, Check, X, AlertCircle, 
  Clock, Users, Settings, ArrowLeft, Info
} from 'lucide-react'
import Link from 'next/link'

interface FreeTrialSettings {
  enabled: boolean
  duration_days: number
  apps: string[]
}

interface AppOption {
  id: string
  name: string
  description: string
}

const availableApps: AppOption[] = [
  { id: 'menu-generator', name: 'Личный шеф', description: 'Генератор меню и рецепты' },
  { id: 'macro-calculator', name: 'Калькулятор макросов', description: 'Расчет БЖУ' },
  { id: 'if-calculator', name: 'Калькулятор IF', description: 'Интервальное голодание' },
  { id: 'keto-flu-calculator', name: 'Калькулятор кетогриппа', description: 'Симптомы кето-гриппа' },
  { id: 'shopping-list', name: 'Список покупок', description: 'Автоматический список' },
  { id: 'recipe-generator', name: 'Генератор рецептов', description: 'Создание рецептов' },
  { id: 'hunger-tracker', name: 'Трекер голода', description: 'Отслеживание голода' },
  { id: 'if-progress-tracker', name: 'Трекер прогресса IF', description: 'Прогресс голодания' },
  { id: 'progress-notes', name: 'Заметки о прогрессе', description: 'Дневник изменений' },
  { id: 'fasting-workout', name: 'Тренировки на голоде', description: 'Планы тренировок' }
]

export default function FreeTrialAdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<FreeTrialSettings>({
    enabled: true,
    duration_days: 7,
    apps: ['menu-generator', 'macro-calculator', 'if-calculator', 'shopping-list', 'recipe-generator']
  })

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!user.is_admin) {
      router.push('/')
      return
    }

    fetchSettings()
  }, [user, authLoading, router])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/free-trial', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить настройки')
      }
      
      const data = await response.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      
      const response = await fetch('/api/admin/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Не удалось сохранить настройки')
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const toggleApp = (appId: string) => {
    setSettings(prev => ({
      ...prev,
      apps: prev.apps.includes(appId)
        ? prev.apps.filter(id => id !== appId)
        : [...prev.apps, appId]
    }))
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-electric animate-spin" />
      </main>
    )
  }

  if (!user?.is_admin) {
    return null
  }

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Gift className="w-7 h-7 text-white" />
              </div>
              Бесплатный доступ для новых пользователей
            </h1>
            <p className="text-white/60 mt-2">
              Настройте бесплатный доступ на 7 дней для новых пользователей
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Настройки успешно сохранены!
          </motion.div>
        )}

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass border border-white/10 p-6 lg:p-8 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-400" />
            Основные настройки
          </h2>

          {/* Enable/Disable */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 text-violet-500 focus:ring-2 focus:ring-violet-500"
              />
              <div>
                <div className="text-white font-medium">Включить бесплатный доступ</div>
                <div className="text-white/50 text-sm">
                  Новые пользователи автоматически получат доступ на указанный период
                </div>
              </div>
            </label>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Длительность бесплатного доступа (дней)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.duration_days}
              onChange={(e) => setSettings(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 7 }))}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-white/50 text-sm mt-2">
              Рекомендуется: 7 дней
            </p>
          </div>
        </motion.div>

        {/* Apps Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl glass border border-white/10 p-6 lg:p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-400" />
              Доступные приложения
            </h2>
            <div className="text-white/50 text-sm">
              Выбрано: {settings.apps.length} из {availableApps.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableApps.map((app) => {
              const isSelected = settings.apps.includes(app.id)
              return (
                <motion.button
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isSelected ? (
                          <Check className="w-5 h-5 text-violet-400" />
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-white/30" />
                        )}
                        <span className="font-medium text-white">{app.name}</span>
                      </div>
                      <p className="text-white/50 text-sm mt-1">{app.description}</p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-white/70 text-sm">
              <p className="font-medium text-white mb-1">Важно:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li>Личный шеф (menu-generator) рекомендуется включить всегда</li>
                <li>Выбранные приложения будут доступны новым пользователям в течение бесплатного периода</li>
                <li>После истечения периода доступ будет закрыт, пока пользователь не купит курс</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end gap-4"
        >
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить настройки
              </>
            )}
          </button>
        </motion.div>
      </div>
    </main>
  )
}

