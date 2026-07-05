import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Plus } from 'lucide-react'
import { useAppDispatch, useAuth } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import UserMenu from './UserMenu'

export default function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = !!(user as Record<string, unknown> | null)?.is_admin

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login', { replace: true })
  }

  const showQuickAdd = location.pathname !== '/diary'

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar userName={user?.name ?? ''} userEmail={user?.email ?? ''} isAdmin={isAdmin} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — visible on mobile only; desktop nav lives in the sidebar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-foreground">FitTrack</span>
          </span>
          <UserMenu userName={user?.name ?? ''} userEmail={user?.email ?? ''} isAdmin={isAdmin} onLogout={handleLogout} />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div key={location.pathname} className="page-in">
            <Outlet />
          </div>
        </main>
      </div>

      {showQuickAdd && (
        <button
          onClick={() => navigate('/diary')}
          aria-label="Agregar alimento al diario"
          title="Agregar alimento"
          className="fixed right-4 bottom-20 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-elevated transition-transform hover:scale-105 active:scale-95 lg:bottom-8"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      <BottomNav />
    </div>
  )
}
