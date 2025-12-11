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
  primary: 'bg-gradient-to-r from-accent-electric to-primary-500 text-white hover:from-primary-400 hover:to-accent-electric shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]',
  secondary: 'bg-transparent border-2 border-white/20 text-white hover:border-accent-electric hover:bg-accent-electric/10',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500',
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
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
          'relative inline-flex items-center justify-center gap-2 font-display font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {!isLoading && leftIcon}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon}
        
        {/* Shimmer effect on hover */}
        {variant === 'primary' && (
          <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

