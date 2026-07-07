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

// Library
const LibraryPage = lazy(() => import('@/pages/library/LibraryPage'))
const MyFoodsPage = lazy(() => import('@/pages/library/MyFoodsPage'))
const RecipesPage = lazy(() => import('@/pages/library/RecipesPage'))
const TemplatesPage = lazy(() => import('@/pages/library/TemplatesPage'))
const RecipeEditorPage = lazy(() => import('@/pages/recipes/RecipeEditorPage'))
const RecipeDetailPage = lazy(() => import('@/pages/recipes/RecipeDetailPage'))

// Reports
const ReportsLayout = lazy(() => import('@/pages/reports/ReportsLayout'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const DietQualityPage = lazy(() => import('@/pages/quality/DietQualityPage'))
const DietQualityAssessmentPage = lazy(() => import('@/pages/quality/DietQualityAssessmentPage'))
const DietQualityAssessmentDetailPage = lazy(() => import('@/pages/quality/DietQualityAssessmentDetailPage'))

// Admin
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminFoodsPage = lazy(() => import('@/pages/admin/AdminFoodsPage'))
const FdcPage = lazy(() => import('@/pages/admin/FdcPage'))
const ImportBatchesPage = lazy(() => import('@/pages/admin/ImportBatchesPage'))
const NutrientMappingsPage = lazy(() => import('@/pages/admin/NutrientMappingsPage'))
const AuditPage = lazy(() => import('@/pages/admin/AuditPage'))

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
          { path: '/foods', element: <Navigate to="/library/foods" replace /> },
          { path: '/foods/:id', element: wrap(FoodDetailPage) },
          {
            path: '/library',
            element: wrap(LibraryPage),
            children: [
              { path: 'foods', element: wrap(FoodsPage) },
              { path: 'my-foods', element: wrap(MyFoodsPage) },
              { path: 'recipes', element: wrap(RecipesPage) },
              { path: 'templates', element: wrap(TemplatesPage) },
            ],
          },
          { path: '/recipes/new', element: wrap(RecipeEditorPage) },
          { path: '/recipes/:id', element: wrap(RecipeDetailPage) },
          { path: '/recipes/:id/edit', element: wrap(RecipeEditorPage) },
          { path: '/diary', element: wrap(DiaryPage) },
          {
            path: '/reports',
            element: wrap(ReportsLayout),
            children: [
              { index: true, element: wrap(ReportsPage) },
              { path: 'quality', element: wrap(DietQualityPage) },
            ],
          },
          { path: '/reports/quality/assessment', element: wrap(DietQualityAssessmentPage) },
          { path: '/reports/quality/assessments/:id', element: wrap(DietQualityAssessmentDetailPage) },
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
        children: [
          {
            path: '/admin',
            element: wrap(AdminLayout),
            children: [
              { index: true, element: <Navigate to="/admin/foods" replace /> },
              { path: 'foods', element: wrap(AdminFoodsPage) },
              { path: 'imports', element: wrap(ImportBatchesPage) },
              { path: 'fdc', element: wrap(FdcPage) },
              { path: 'nutrient-mappings', element: wrap(NutrientMappingsPage) },
              { path: 'audit', element: wrap(AuditPage) },
            ],
          },
        ],
      },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage />, errorElement: <RouteErrorPage /> },
])
