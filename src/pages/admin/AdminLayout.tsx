import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@/components/ui/Tabs'

type AdminTab = 'foods' | 'imports' | 'fdc' | 'nutrient-mappings' | 'audit'

const TABS: { value: AdminTab; label: string }[] = [
  { value: 'foods', label: 'Alimentos' },
  { value: 'imports', label: 'Importaciones' },
  { value: 'fdc', label: 'FoodData Central' },
  { value: 'nutrient-mappings', label: 'Mapeos' },
  { value: 'audit', label: 'Auditoría' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const current = (TABS.find((t) => location.pathname.startsWith(`/admin/${t.value}`))?.value ?? 'foods') as AdminTab

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Administración</h1>
      <Tabs tabs={TABS} value={current} onChange={(v) => navigate(`/admin/${v}`)} />
      <Outlet />
    </div>
  )
}
