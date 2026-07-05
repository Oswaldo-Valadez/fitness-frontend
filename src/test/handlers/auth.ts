import { HttpResponse, http } from 'msw'
import type { User } from '@/api/generated/model'

export const demoUser: User = {
  id: 1,
  name: 'Demo User',
  email: 'demo@fitness.local',
  is_admin: false,
  timezone: 'America/Mexico_City',
  locale: 'es_MX',
  onboarding_completed_at: '2026-01-01T00:00:00Z',
  has_active_consents: true,
  has_profile: true,
}

export const authHandlers = [
  http.get('/sanctum/csrf-cookie', () => new HttpResponse(null, { status: 204 })),

  http.get('/api/user', () => HttpResponse.json(demoUser)),

  http.post('/api/auth/login', () => HttpResponse.json({ message: 'Sesión iniciada.', user: demoUser })),

  http.post('/api/auth/register', () => HttpResponse.json({ message: 'Registro exitoso.', user: demoUser }, { status: 201 })),

  http.post('/api/auth/logout', () => HttpResponse.json({ message: 'Sesión cerrada.' })),
]
