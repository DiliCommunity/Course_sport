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
        <div className="card card-hover h-full">
          {/* Image Container */}
          <div className="relative aspect-video overflow-hidden">
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
              <div className="w-16 h-16 rounded-full bg-accent-teal/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-accent-teal/30">
                <Play className="w-6 h-6 text-dark-900 ml-1" fill="currentColor" />
              </div>
            </motion.div>

            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <span className="badge glass">{category}</span>
            </div>

            {/* Free preview badge */}
            <div className="absolute top-4 right-4">
              <span className="badge bg-accent-mint/90 text-dark-900 border-none font-semibold">
                🎁 15% бесплатно
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Difficulty & Duration */}
            <div className="flex items-center gap-3">
              <span className={cn('badge text-xs', difficultyLabels[difficulty].color)}>
                {difficultyLabels[difficulty].label}
              </span>
              <span className="flex items-center gap-1 text-sm text-white/50">
                <Clock className="w-4 h-4" />
                {formatDuration(duration)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-xl text-white group-hover:text-accent-teal transition-colors line-clamp-2">
              {title}
            </h3>

            {/* Description */}
            <p className="text-white/60 text-sm line-clamp-2 leading-relaxed">
              {shortDescription}
            </p>

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/10">
                <Image
                  src={instructorAvatar}
                  alt={instructorName}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm text-white/70">{instructorName}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent-cream fill-accent-cream" />
                <span className="text-white font-medium">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{studentsCount.toLocaleString('ru-RU')}</span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-2xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {formatPrice(price)}
                </span>
                {originalPrice && (
                  <span className="text-sm text-white/40 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center text-dark-900 shadow-[0_0_20px_rgba(52,211,153,0.4)] group-hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] transition-all duration-300"
                whileHover={{ x: 5, scale: 1.05 }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

