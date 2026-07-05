import { Apple, BookOpen, LayoutDashboard, Settings, ShieldCheck, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Primary navigation — kept to 5 items so it also works as a mobile bottom nav. */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/diary', label: 'Diario', icon: BookOpen },
  { to: '/foods', label: 'Alimentos', icon: Apple },
  { to: '/profile', label: 'Perfil', icon: User },
  { to: '/account', label: 'Cuenta', icon: Settings },
]

export const ADMIN_NAV: NavItem = { to: '/admin/foods', label: 'Admin', icon: ShieldCheck }
