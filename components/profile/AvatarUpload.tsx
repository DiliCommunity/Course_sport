'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, Check } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  currentAvatar: string | null
  userId: string
  onUploadComplete: (url: string) => void
}

export function AvatarUpload({ currentAvatar, userId, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (максимум 5MB)')
      return
    }

    setUploading(true)
    setUploaded(false)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки')
      }

      const data = await response.json()
      setUploaded(true)
      onUploadComplete(data.avatar_url)

      setTimeout(() => {
        setUploaded(false)
      }, 2000)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Не удалось загрузить аватар')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group">
      <motion.div
        className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 group-hover:ring-accent-teal/30 transition-all duration-300 cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
      >
        {currentAvatar ? (
          <Image
            src={currentAvatar}
            alt="Avatar"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-teal/20 to-accent-mint/20 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : uploaded ? (
            <Check className="w-8 h-8 text-accent-mint" />
          ) : (
            <Camera className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
          )}
        </div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-white/50 text-center mt-2 group-hover:text-white/70 transition-colors">
        Нажмите для загрузки
      </p>
    </div>
  )
}
