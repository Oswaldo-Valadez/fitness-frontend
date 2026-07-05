import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Settings, ShieldCheck, User } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface Props {
  userName: string
  userEmail: string
  isAdmin: boolean
  onLogout: () => void
}

export default function UserMenu({ userName, userEmail, isAdmin, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative lg:hidden" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
      >
        {userName.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <div role="menu" className="modal-panel-in absolute right-0 top-11 z-40 w-60 rounded-xl border border-border bg-surface p-2 shadow-elevated">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted">{userEmail}</p>
          </div>

          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
            >
              <User className="h-4 w-4 text-muted" /> Perfil
            </Link>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
            >
              <Settings className="h-4 w-4 text-muted" /> Cuenta
            </Link>
            {isAdmin && (
              <Link
                to="/admin/foods"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
              >
                <ShieldCheck className="h-4 w-4 text-muted" /> Admin
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-xs font-medium text-muted">Tema</span>
            <ThemeToggle />
          </div>

          <div className="border-t border-border pt-1">
            <button
              onClick={onLogout}
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
