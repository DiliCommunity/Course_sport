'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Users, Star, Play, ArrowRight } from 'lucide-react'
import { cn, formatPrice, formatDuration } from '@/lib/utils'

interface CourseCardProps {
  id: string
  title: string
  shortDescription: string
  imageUrl: string
  price: number
  originalPrice?: number | null
  duration: number
  studentsCount: number
  rating: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructorName: string
  instructorAvatar: string
  category: string
  index?: number
}

const difficultyLabels = {
  beginner: { label: 'Начинающий', color: 'badge-neon' },
  intermediate: { label: 'Средний', color: 'badge-electric' },
  advanced: { label: 'Продвинутый', color: 'badge-flame' },
}

export function CourseCard({
  id,
  title,
  shortDescription,
  imageUrl,
  price,
  originalPrice,
  duration,
  studentsCount,
  rating,
  difficulty,
  instructorName,
  instructorAvatar,
  category,
  index = 0,
}: CourseCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/courses/${id}`} className="block group">
        <div className="card card-hover h-full border-2 border-emerald-400/30 hover:border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.15)] hover:shadow-[0_0_40px_rgba(52,211,153,0.35)] transition-all duration-500">
          {/* Image Container */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60" />
            
            {/* Play button */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-400/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-emerald-400/40">
                <Play className="w-5 h-5 text-dark-900 ml-0.5" fill="currentColor" />
              </div>
            </motion.div>

            {/* Category badge */}
            <div className="absolute top-3 left-3">
              <span className="badge glass text-xs px-2 py-1">{category}</span>
            </div>

            {/* Free preview badge */}
            <div className="absolute top-3 right-3">
              <span className="badge bg-emerald-400 text-dark-900 border-none font-bold text-xs px-2 py-1 shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                🎁 15% бесплатно
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Difficulty & Duration */}
            <div className="flex items-center gap-2">
              <span className={cn('badge text-xs px-2 py-0.5', difficultyLabels[difficulty].color)}>
                {difficultyLabels[difficulty].label}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/50">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(duration)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
              {title}
            </h3>

            {/* Description */}
            <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">
              {shortDescription}
            </p>

            {/* Instructor */}
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden ring-2 ring-emerald-400/30">
                <Image
                  src={instructorAvatar}
                  alt={instructorName}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-white/70">{instructorName}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-white/50">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-white font-medium">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{studentsCount.toLocaleString('ru-RU')}</span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-emerald-400/20">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {formatPrice(price)}
                </span>
                {originalPrice && (
                  <span className="text-xs text-white/40 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              <motion.div
                className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center text-dark-900 shadow-[0_0_15px_rgba(52,211,153,0.4)] group-hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] transition-all duration-300"
                whileHover={{ x: 3, scale: 1.05 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

