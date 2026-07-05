import { useEffect } from 'react'
import { apiEvents } from '@/api/apiEvents'
import { useAppDispatch } from '@/store/hooks'
import { clearUser, fetchMe, setConsentRequired } from '@/store/authSlice'

/**
 * Punto de entrada — verifica si hay sesión activa al cargar la app y
 * escucha eventos globales del cliente HTTP (401 / 409 CONSENT_REQUIRED).
 * El router reacciona a los cambios de estado de Redux, así que este
 * componente no necesita navegar: solo actualiza el store.
 */
export default function AppInit() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchMe())

    const unsubscribeSessionExpired = apiEvents.on('session-expired', () => {
      dispatch(clearUser())
    })

    const unsubscribeConsentRequired = apiEvents.on('consent-required', (event) => {
      dispatch(setConsentRequired(event.detail))
    })

    return () => {
      unsubscribeSessionExpired()
      unsubscribeConsentRequired()
    }
  }, [dispatch])

  return null
}
