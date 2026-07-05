import { type ReactNode } from 'react'
import { Activity } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Centered container for auth pages (login, register, password recovery). */
export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-linear-to-br from-primary/5 via-background to-accent/5 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-elevated">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="space-y-6 rounded-2xl border border-border bg-surface p-8 shadow-elevated">{children}</div>
      </div>
    </div>
  )
}
