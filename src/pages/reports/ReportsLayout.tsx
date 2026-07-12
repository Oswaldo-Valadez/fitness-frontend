import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@/components/ui/Tabs'

type ReportTab = 'nutrition' | 'quality' | 'nutrients'

/**
 * Shared layout for /reports: keeps the primary nav at five items while
 * exposing the nutrition report, the diet-quality module and the
 * micronutrients report as tabs. No new bottom-nav item is added for
 * nutrients — it lives entirely under this existing Reports section.
 */
export default function ReportsLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const active: ReportTab = pathname.startsWith('/reports/quality') ? 'quality' : pathname.startsWith('/reports/nutrients') ? 'nutrients' : 'nutrition'

  const destinations: Record<ReportTab, string> = {
    nutrition: '/reports',
    quality: '/reports/quality',
    nutrients: '/reports/nutrients',
  }

  return (
    <div className="space-y-5">
      <Tabs<ReportTab>
        tabs={[
          { value: 'nutrition', label: 'Nutrición' },
          { value: 'quality', label: 'Calidad de dieta' },
          { value: 'nutrients', label: 'Nutrientes' },
        ]}
        value={active}
        onChange={(tab) => navigate(destinations[tab])}
      />
      <Outlet />
    </div>
  )
}
