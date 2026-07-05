import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@/components/ui/Tabs'

type LibraryTab = 'foods' | 'my-foods' | 'recipes' | 'templates'

const TABS: { value: LibraryTab; label: string }[] = [
  { value: 'foods', label: 'Alimentos' },
  { value: 'my-foods', label: 'Mis alimentos' },
  { value: 'recipes', label: 'Recetas' },
  { value: 'templates', label: 'Plantillas' },
]

export default function LibraryPage() {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/library') {
    return <Navigate to="/library/foods" replace />
  }

  const current = (TABS.find((t) => location.pathname.startsWith(`/library/${t.value}`))?.value ?? 'foods') as LibraryTab

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Biblioteca</h1>
      <Tabs tabs={TABS} value={current} onChange={(v) => navigate(`/library/${v}`)} />
      <Outlet />
    </div>
  )
}
