import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { fetchMe } from '@/store/authSlice'

/**
 * Punto de entrada — verifica si hay sesión activa al cargar la app.
 * El router ya maneja la navegación; este componente solo hidrata el store.
 */
export default function AppInit() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchMe())
  }, [dispatch])

  return null
}
