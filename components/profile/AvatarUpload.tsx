'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatar: string | null
  userId: string
  onUploadComplete: (url: string) => void
}

// Эмодзи для выбора аватара
const AVATAR_EMOJIS = [
  '💪', '🏃', '🧘', '🏋️', '⚡',
  '🔥', '🌟', '💚', '🎯', '🏆',
  '🥗', '🍎', '💎', '🦋', '🌈',
  '🎨', '🚀', '✨', '🌸', '🐱',
  '🐶', '🦁', '🐼', '🦊', '🐨',
  '😎', '🥰', '😊', '🤩', '😇'
]

export function AvatarUpload({ currentAvatar, userId, onUploadComplete }: AvatarUploadProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<string>(currentAvatar || '💚')
  const [saving, setSaving] = useState(false)

  const handleEmojiSelect = async (emoji: string) => {
    setSaving(true)
    setSelectedEmoji(emoji)
    
    try {
      // Сохраняем эмодзи как аватар
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          avatar_url: emoji,
        }),
      })

      if (response.ok) {
        onUploadComplete(emoji)
        setIsPickerOpen(false)
      }
    } catch (error) {
      console.error('Failed to save avatar:', error)
    } finally {
      setSaving(false)
    }
  }

  // Проверяем, является ли текущий аватар эмодзи
  const displayEmoji = AVATAR_EMOJIS.includes(currentAvatar || '') 
    ? currentAvatar 
    : selectedEmoji

  return (
    <div className="relative group">
      <motion.button
        onClick={() => setIsPickerOpen(true)}
        className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-accent-teal/50 transition-all duration-300 cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-full h-full bg-gradient-to-br from-accent-teal/30 to-accent-mint/30 flex items-center justify-center">
          <span className="text-6xl">{displayEmoji}</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <p className="text-sm text-white font-medium">Изменить</p>
        </div>
      </motion.button>

      <p className="text-xs text-white/50 text-center mt-2">
        Нажмите для выбора
      </p>

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPickerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[320px] max-w-[90vw]"
            >
              <div className="bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h3 className="font-display font-bold text-lg text-white">
                    Выберите аватар
                  </h3>
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Emoji Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_EMOJIS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        disabled={saving}
                        className={`
                          w-11 h-11 rounded-xl flex items-center justify-center text-2xl
                          transition-all duration-200 relative
                          ${displayEmoji === emoji 
                            ? 'bg-accent-teal/30 ring-2 ring-accent-teal' 
                            : 'hover:bg-white/10 bg-white/5'
                          }
                          ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {emoji}
                        {displayEmoji === emoji && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-teal flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-dark-900" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 pt-0">
                  <p className="text-xs text-white/40 text-center">
                    Нажмите на эмодзи для выбора
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
