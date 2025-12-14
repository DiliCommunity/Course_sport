'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Heart, Target, Timer, LucideIcon 
} from 'lucide-react'

interface CategoryCardProps {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  coursesCount?: number
  index?: number
  imageUrl?: string
}

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  target: Target,
  timer: Timer,
}

const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
  teal: {
    bg: 'bg-accent-teal/10',
    text: 'text-accent-teal',
    glow: 'group-hover:shadow-[0_0_40px_rgba(45,212,191,0.3)]',
  },
  mint: {
    bg: 'bg-accent-mint/10',
    text: 'text-accent-mint',
    glow: 'group-hover:shadow-[0_0_40px_rgba(167,243,208,0.3)]',
  },
  cream: {
    bg: 'bg-accent-cream/10',
    text: 'text-accent-cream',
    glow: 'group-hover:shadow-[0_0_40px_rgba(254,243,226,0.3)]',
  },
  aqua: {
    bg: 'bg-accent-aqua/10',
    text: 'text-accent-aqua',
    glow: 'group-hover:shadow-[0_0_40px_rgba(103,232,249,0.3)]',
  },
  turquoise: {
    bg: 'bg-accent-turquoise/10',
    text: 'text-accent-turquoise',
    glow: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]',
  },
  electric: {
    bg: 'bg-accent-teal/10',
    text: 'text-accent-teal',
    glow: 'group-hover:shadow-[0_0_40px_rgba(45,212,191,0.3)]',
  },
  neon: {
    bg: 'bg-accent-mint/10',
    text: 'text-accent-mint',
    glow: 'group-hover:shadow-[0_0_40px_rgba(167,243,208,0.3)]',
  },
  flame: {
    bg: 'bg-accent-cream/10',
    text: 'text-accent-cream',
    glow: 'group-hover:shadow-[0_0_40px_rgba(254,243,226,0.3)]',
  },
  gold: {
    bg: 'bg-accent-cream/10',
    text: 'text-accent-cream',
    glow: 'group-hover:shadow-[0_0_40px_rgba(254,243,226,0.3)]',
  },
  purple: {
    bg: 'bg-accent-aqua/10',
    text: 'text-accent-aqua',
    glow: 'group-hover:shadow-[0_0_40px_rgba(103,232,249,0.3)]',
  },
}

export function CategoryCard({
  id,
  name,
  slug,
  description,
  icon,
  color,
  coursesCount = 0,
  index = 0,
  imageUrl,
}: CategoryCardProps) {
  const Icon = iconMap[icon] || Heart
  const colorClasses = colorMap[color] || colorMap.teal

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/categories/${slug}`} className="block group">
        <motion.div
          className={`card h-full overflow-hidden transition-all duration-500 ${colorClasses.glow}`}
          whileHover={{ y: -8 }}
        >
          {/* Image */}
          {imageUrl && (
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
              <div className="absolute top-4 left-4">
                <motion.div
                  className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center backdrop-blur-sm`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Icon className={`w-6 h-6 ${colorClasses.text}`} />
                </motion.div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-accent-teal transition-colors">
              {name}
            </h3>
            
            <p className="text-white/60 text-sm mb-4 line-clamp-2">
              {description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-sm text-white/50">
                {coursesCount} {coursesCount === 1 ? 'курс' : coursesCount < 5 ? 'курса' : 'курсов'}
              </span>
              <motion.span
                className={`text-sm font-medium ${colorClasses.text}`}
                whileHover={{ x: 5 }}
              >
                Смотреть →
              </motion.span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

