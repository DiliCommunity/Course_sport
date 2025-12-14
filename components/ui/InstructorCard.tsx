'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Users, BookOpen, Award } from 'lucide-react'

interface InstructorCardProps {
  id: string
  name: string
  bio: string
  avatarUrl: string
  specialization: string
  experienceYears: number
  studentsCount: number
  coursesCount: number
  rating: number
  index?: number
}

export function InstructorCard({
  id,
  name,
  bio,
  avatarUrl,
  specialization,
  experienceYears,
  studentsCount,
  coursesCount,
  rating,
  index = 0,
}: InstructorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/instructors/${id}`} className="block group">
        <motion.div
          className="card h-full overflow-hidden"
          whileHover={{ y: -8 }}
        >
          {/* Avatar Section */}
          <div className="relative h-48 overflow-hidden">
            <Image
              src={avatarUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
            
            {/* Rating Badge */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full glass">
              <Star className="w-4 h-4 text-accent-gold fill-accent-gold" />
              <span className="font-semibold text-white">{rating.toFixed(1)}</span>
            </div>

            {/* Experience Badge */}
            <div className="absolute top-4 left-4">
              <span className="badge badge-electric">
                <Award className="w-3 h-3 mr-1" />
                {experienceYears} лет опыта
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-accent-electric transition-colors">
                {name}
              </h3>
              <p className="text-accent-electric text-sm mt-1">{specialization}</p>
            </div>

            <p className="text-white/60 text-sm line-clamp-3 leading-relaxed">
              {bio}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4 text-accent-neon" />
                <span className="text-sm">
                  <span className="text-white font-semibold">{studentsCount.toLocaleString('ru-RU')}</span> студентов
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <BookOpen className="w-4 h-4 text-accent-flame" />
                <span className="text-sm">
                  <span className="text-white font-semibold">{coursesCount}</span> курсов
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

