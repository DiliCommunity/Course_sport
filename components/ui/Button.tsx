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
  primary: 'bg-gradient-to-r from-accent-teal via-primary-500 to-accent-teal bg-[length:200%_100%] text-dark-900 hover:bg-[position:100%_0] border border-accent-teal/30 shadow-[0_4px_20px_rgba(45,212,191,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] font-semibold tracking-wide',
  secondary: 'bg-transparent border border-white/20 text-white hover:border-accent-teal/50 hover:bg-accent-teal/5 backdrop-blur-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5 tracking-wide',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 border border-red-400/30 shadow-[0_4px_20px_rgba(239,68,68,0.2)]',
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

