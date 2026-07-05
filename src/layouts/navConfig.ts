import { BarChart3, BookOpen, LayoutDashboard, Library, ShieldCheck, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/**
 * Primary navigation — kept to 5 items so it also works as a mobile bottom
 * nav. Account/settings is intentionally not here: it's reachable from
 * UserMenu (mobile) and the Sidebar footer (desktop) instead.
 */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/diary', label: 'Diario', icon: BookOpen },
  { to: '/library', label: 'Biblioteca', icon: Library },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/profile', label: 'Perfil', icon: User },
]

export const ADMIN_NAV: NavItem = { to: '/admin/foods', label: 'Admin', icon: ShieldCheck }
