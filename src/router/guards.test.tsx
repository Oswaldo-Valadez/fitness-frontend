import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAdmin, RequireAuth, RequireGuest } from './guards'
import { useAuth } from '@/store/hooks'

vi.mock('@/store/hooks', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

describe('route guards', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset()
  })

  it('RequireAuth redirects unauthenticated users to login', () => {
    mockedUseAuth.mockReturnValue({ user: null, initialized: true, status: 'idle' })

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

  it('RequireAuth redirects users without onboarding to onboarding page', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        timezone: 'America/Mexico_City',
        locale: 'es_MX',
        onboarding_completed_at: null,
        has_active_consents: true,
        has_profile: true,
      },
      initialized: true,
      status: 'idle',
    })

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

  it('RequireGuest redirects authenticated users to dashboard', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        timezone: 'America/Mexico_City',
        locale: 'es_MX',
        onboarding_completed_at: '2026-01-01T00:00:00Z',
        has_active_consents: true,
        has_profile: true,
      },
      initialized: true,
      status: 'idle',
    })

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
    mockedUseAuth.mockReturnValue({
      user: {
        id: 2,
        name: 'Regular',
        email: 'regular@example.com',
        timezone: 'America/Mexico_City',
        locale: 'es_MX',
        onboarding_completed_at: '2026-01-01T00:00:00Z',
        is_admin: false,
      },
      initialized: true,
      status: 'idle',
    } as never)

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
    mockedUseAuth.mockReturnValue({
      user: {
        id: 3,
        name: 'Admin',
        email: 'admin@example.com',
        timezone: 'America/Mexico_City',
        locale: 'es_MX',
        onboarding_completed_at: '2026-01-01T00:00:00Z',
        is_admin: true,
      },
      initialized: true,
      status: 'idle',
    } as never)

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