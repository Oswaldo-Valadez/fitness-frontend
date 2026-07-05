/* eslint-disable react-refresh/only-export-components */
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { RequireAdmin, RequireAuth, RequireGuest } from './guards'
import RouteErrorPage from '@/pages/RouteErrorPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Lazy imports — cada página se carga solo cuando se necesita
import { Suspense, lazy } from 'react'
import type { ReactElement } from 'react'
import PageSpinner from '@/components/ui/PageSpinner'

const wrap = (Component: React.LazyExoticComponent<() => ReactElement>) => (
  <Suspense fallback={<PageSpinner />}>
    <Component />
  </Suspense>
)

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// Onboarding
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'))

// App
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const FoodsPage = lazy(() => import('@/pages/foods/FoodsPage'))
const FoodDetailPage = lazy(() => import('@/pages/foods/FoodDetailPage'))
const DiaryPage = lazy(() => import('@/pages/diary/DiaryPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const AccountPage = lazy(() => import('@/pages/account/AccountPage'))

// Admin
const AdminFoodsPage = lazy(() => import('@/pages/admin/AdminFoodsPage'))

// Layout
const AppLayout = lazy(() => import('@/layouts/AppLayout'))

export const router = createBrowserRouter([
  // ── Rutas públicas (solo guests) ──────────────────────────────────
  {
    element: <RequireGuest />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: wrap(LoginPage) },
      { path: '/register', element: wrap(RegisterPage) },
      { path: '/forgot-password', element: wrap(ForgotPassword) },
      { path: '/reset-password', element: wrap(ResetPassword) },
    ],
  },

  // ── Onboarding (auth requerido, sin layout completo) ──────────────
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [{ path: '/onboarding', element: wrap(OnboardingPage) }],
  },

  // ── App principal (auth + onboarding completado) ──────────────────
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
        element: wrap(AppLayout),
        children: [
          { path: '/dashboard', element: wrap(DashboardPage) },
          { path: '/foods', element: wrap(FoodsPage) },
          { path: '/foods/:id', element: wrap(FoodDetailPage) },
          { path: '/diary', element: wrap(DiaryPage) },
          { path: '/profile', element: wrap(ProfilePage) },
          { path: '/account', element: wrap(AccountPage) },
        ],
      },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────────────
  {
    element: <RequireAdmin />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: wrap(AppLayout),
        children: [{ path: '/admin/foods', element: wrap(AdminFoodsPage) }],
      },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage />, errorElement: <RouteErrorPage /> },
])
