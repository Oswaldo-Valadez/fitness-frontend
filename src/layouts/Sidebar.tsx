import { NavLink } from 'react-router-dom'
import { Activity, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { ADMIN_NAV, PRIMARY_NAV } from './navConfig'

interface Props {
  userName: string
  userEmail: string
  isAdmin: boolean
  onLogout: () => void
}

export default function Sidebar({ userName, userEmail, isAdmin, onLogout }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-muted hover:text-foreground',
    )

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
          <Activity className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold text-foreground">FitTrack</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-border pt-3">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Administración</p>
            </div>
            <NavLink to={ADMIN_NAV.to} className={linkClass}>
              <ADMIN_NAV.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {ADMIN_NAV.label}
            </NavLink>
          </>
        )}
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        <ThemeToggle className="w-full justify-center" />
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted">{userEmail}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="cursor-pointer rounded-lg p-2 text-muted hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
