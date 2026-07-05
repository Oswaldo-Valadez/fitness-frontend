import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Props extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
}

const VARIANTS = {
  neutral: 'bg-surface-muted text-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-accent/10 text-accent',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
}

const SIZES = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
}

export default function Badge({ variant = 'neutral', size = 'sm', className, children, ...rest }: Props) {
  return (
    <span className={clsx('inline-flex items-center rounded-full font-medium whitespace-nowrap', VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </span>
  )
}
