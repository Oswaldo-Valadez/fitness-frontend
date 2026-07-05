import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAdmin, RequireAuth, RequireGuest } from './guards'
import { useAuth } from '@/store/hooks'
import type { User } from '@/types/models'

vi.mock('@/store/hooks', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const baseUser: User = {
  id: 1,
  name: 'Test',
  email: 'test@example.com',
  is_admin: false,
  timezone: 'America/Mexico_City',
  locale: 'es_MX',
  onboarding_completed_at: '2026-01-01T00:00:00Z',
  has_active_consents: true,
  has_profile: true,
}

function authState(user: User | null) {
  return { user, initialized: true, status: 'idle' as const, consentRequired: null }
}

describe('route guards', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset()
  })

  it('RequireAuth redirects unauthenticated users to login', () => {
    mockedUseAuth.mockReturnValue(authState(null))

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/private" element={<div>private page</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('RequireAuth redirects users without onboarding_completed_at to onboarding page', () => {
    mockedUseAuth.mockReturnValue(authState({ ...baseUser, onboarding_completed_at: null }))

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>dashboard page</div>} />
          </Route>
          <Route path="/onboarding" element={<div>onboarding page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('onboarding page')).toBeInTheDocument()
  })

  it('RequireAuth redirects users without a saved profile to onboarding, even with a timestamp', () => {
    mockedUseAuth.mockReturnValue(authState({ ...baseUser, has_profile: false }))

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>dashboard page</div>} />
          </Route>
          <Route path="/onboarding" element={<div>onboarding page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('onboarding page')).toBeInTheDocument()
  })

  it('RequireAuth does not redirect to onboarding just because consents were revoked', () => {
    mockedUseAuth.mockReturnValue(authState({ ...baseUser, has_active_consents: false }))

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>dashboard page</div>} />
          </Route>
          <Route path="/onboarding" element={<div>onboarding page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('RequireGuest redirects authenticated users to dashboard', () => {
    mockedUseAuth.mockReturnValue(authState(baseUser))

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<RequireGuest />}>
            <Route path="/login" element={<div>login page</div>} />
          </Route>
          <Route path="/dashboard" element={<div>dashboard page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('RequireAdmin blocks non-admin users', () => {
    mockedUseAuth.mockReturnValue(authState({ ...baseUser, is_admin: false }))

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<div>admin page</div>} />
          </Route>
          <Route path="/dashboard" element={<div>dashboard page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('RequireAdmin allows admin users', () => {
    mockedUseAuth.mockReturnValue(authState({ ...baseUser, is_admin: true }))

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<div>admin page</div>} />
          </Route>
          <Route path="/dashboard" element={<div>dashboard page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('admin page')).toBeInTheDocument()
  })
})
