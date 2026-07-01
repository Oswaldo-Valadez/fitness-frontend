import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAuth } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import { clsx } from 'clsx'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/diary',     label: 'Diario' },
  { to: '/foods',     label: 'Alimentos' },
  { to: '/profile',   label: 'Perfil' },
  { to: '/account',   label: 'Cuenta' },
]

export default function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = !!(user as Record<string, unknown> | null)?.is_admin

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Barra superior */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-emerald-600">FitnessApp</span>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100')
                }
              >
                {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin/foods"
                className={({ isActive }) =>
                  clsx('rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-100')
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 md:block">{user?.name}</span>
            <button onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
