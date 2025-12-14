'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Dumbbell, Heart, Target, Flame, Bike, Users, 
  Swords, Mountain, Waves, Timer, LucideIcon 
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
}

const iconMap: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  heart: Heart,
  target: Target,
  flame: Flame,
  bike: Bike,
  users: Users,
  swords: Swords,
  mountain: Mountain,
  waves: Waves,
  timer: Timer,
}

const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
  electric: {
    bg: 'bg-accent-electric/10',
    text: 'text-accent-electric',
    glow: 'group-hover:shadow-[0_0_40px_rgba(0,212,255,0.3)]',
  },
  neon: {
    bg: 'bg-accent-neon/10',
    text: 'text-accent-neon',
    glow: 'group-hover:shadow-[0_0_40px_rgba(57,255,20,0.3)]',
  },
  flame: {
    bg: 'bg-accent-flame/10',
    text: 'text-accent-flame',
    glow: 'group-hover:shadow-[0_0_40px_rgba(255,107,53,0.3)]',
  },
  gold: {
    bg: 'bg-accent-gold/10',
    text: 'text-accent-gold',
    glow: 'group-hover:shadow-[0_0_40px_rgba(255,215,0,0.3)]',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    glow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]',
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
}: CategoryCardProps) {
  const Icon = iconMap[icon] || Dumbbell
  const colorClasses = colorMap[color] || colorMap.electric

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/categories/${slug}`} className="block group">
        <motion.div
          className={`card h-full p-6 transition-all duration-500 ${colorClasses.glow}`}
          whileHover={{ y: -8 }}
        >
          {/* Icon */}
          <motion.div
            className={`w-14 h-14 rounded-2xl ${colorClasses.bg} flex items-center justify-center mb-5`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Icon className={`w-7 h-7 ${colorClasses.text}`} />
          </motion.div>

          {/* Content */}
          <h3 className="font-display font-bold text-xl text-white mb-2 group-hover:text-accent-electric transition-colors">
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
        </motion.div>
      </Link>
    </motion.div>
  )
}

