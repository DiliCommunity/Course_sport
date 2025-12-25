'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const variants = {
  primary: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-[length:200%_100%] text-dark-900 hover:bg-[position:100%_0] border-2 border-emerald-300/50 shadow-[0_0_25px_rgba(52,211,153,0.4),0_0_50px_rgba(45,212,191,0.2)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6),0_0_80px_rgba(45,212,191,0.4)] font-bold tracking-wide',
  secondary: 'bg-white/10 border-2 border-white/30 text-white hover:border-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-300 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] font-semibold',
  ghost: 'bg-transparent text-white/80 hover:text-emerald-400 hover:bg-white/10 tracking-wide font-medium',
  danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-400 hover:to-rose-400 border-2 border-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] font-bold',
}

const sizes = {
  sm: 'px-5 py-2.5 text-sm rounded-lg',
  md: 'px-8 py-3.5 text-base rounded-lg',
  lg: 'px-10 py-4 text-lg rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2.5 font-display transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {!isLoading && leftIcon}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon}
        
        {/* Premium shimmer effect */}
        {variant === 'primary' && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

