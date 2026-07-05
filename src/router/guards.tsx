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

  // Onboarding solo se considera incompleto si falta el timestamp o el
  // perfil físico. Un consentimiento revocado NO reenvía aquí — eso se
  // maneja de forma reactiva (banner + reaceptación) para no bloquear
  // lecturas; ver ConsentBanner y AppInit.
  const onboardingIncomplete = !user.onboarding_completed_at || !user.has_profile
  if (onboardingIncomplete && location.pathname !== '/onboarding') {
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

  if (!user.is_admin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
