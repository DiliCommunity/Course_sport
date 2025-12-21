'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatar: string | null
  userId: string
  onUploadComplete: (url: string) => void
}

export function AvatarUpload({ currentAvatar, userId, onUploadComplete }: AvatarUploadProps) {
  // Временная заглушка - загрузка аватаров отключена
  // Отображаем иконку сердечка вместо аватара

  return (
    <div className="relative group">
      <motion.div
        className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-accent-teal/30 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {currentAvatar ? (
          <div className="w-full h-full bg-gradient-to-br from-accent-teal/20 to-accent-mint/20 flex items-center justify-center">
            <Heart className="w-12 h-12 text-accent-teal fill-accent-teal" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-teal/20 to-accent-mint/20 flex items-center justify-center">
            <Heart className="w-12 h-12 text-accent-teal fill-accent-teal" />
          </div>
        )}

        {/* Overlay с подсказкой */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="text-center px-2">
            <Heart className="w-8 h-8 text-white/60 mx-auto mb-1" />
            <p className="text-xs text-white/60">Загрузка скоро</p>
          </div>
        </div>
      </motion.div>

      <p className="text-xs text-white/50 text-center mt-2">
        Иконка профиля
      </p>
    </div>
  )
}
