import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/hooks'

/** Solo accesible si el usuario está autenticado */
export function RequireAuth() {
  const { user, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) return null // splash mientras se verifica sesión

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si completó onboarding → ok; si no, redirige al onboarding
  if (!user.onboarding_completed_at && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

/** Solo accesible si NO hay sesión (login, register, etc.) */
export function RequireGuest() {
  const { user, initialized } = useAuth()

  if (!initialized) return null

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/** Solo accesible para admins */
export function RequireAdmin() {
  const { user, initialized } = useAuth()

  if (!initialized) return null

  if (!user) return <Navigate to="/login" replace />

  // is_admin no viene en el tipo base — lo leemos como any del objeto real
  const isAdmin = (user as unknown as { is_admin?: boolean }).is_admin === true
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
