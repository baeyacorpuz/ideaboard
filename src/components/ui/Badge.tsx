import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      primary:
        'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
      secondary:
        'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
      success:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      warning:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      error:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }