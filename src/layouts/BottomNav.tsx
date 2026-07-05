import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { PRIMARY_NAV } from './navConfig'

/** Mobile-only bottom tab bar. Capped at 5 top-level destinations. */
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted')
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
