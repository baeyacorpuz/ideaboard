import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800',
      outlined: 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
      elevated: 'bg-white shadow-lg dark:bg-gray-800',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center justify-end gap-2', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }