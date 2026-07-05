import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover focus-visible:ring-ring shadow-sm',
  secondary: 'bg-surface text-foreground border border-border hover:bg-surface-muted focus-visible:ring-ring shadow-sm',
  danger: 'bg-destructive text-white hover:bg-destructive-hover focus-visible:ring-destructive shadow-sm',
  ghost: 'text-foreground hover:bg-surface-muted focus-visible:ring-ring',
  outline: 'bg-transparent text-primary border border-primary/40 hover:bg-primary/10 focus-visible:ring-ring',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 p-0',
}

export default function Button({ variant = 'primary', size = 'md', loading, iconLeft, iconRight, children, className, disabled, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
}
