'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface LoadingProps {
  fullScreen?: boolean
  text?: string
}

export function Loading({ fullScreen = false, text = 'Загрузка...' }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-teal to-accent-mint p-0.5"
      >
        <div className="w-full h-full rounded-[14px] bg-dark-900 flex items-center justify-center">
          <Zap className="w-8 h-8 text-accent-teal" />
        </div>
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/60 font-medium"
      >
        {text}
      </motion.p>
      
      {/* Loading dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-accent-teal"
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="card">
      <LoadingSkeleton className="aspect-video" />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <LoadingSkeleton className="h-6 w-20" />
          <LoadingSkeleton className="h-6 w-16" />
        </div>
        <LoadingSkeleton className="h-7 w-full" />
        <LoadingSkeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between pt-4 border-t border-white/5">
          <LoadingSkeleton className="h-8 w-24" />
          <LoadingSkeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

