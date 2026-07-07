import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@/components/ui/Tabs'

type ReportTab = 'nutrition' | 'quality'

/**
 * Shared layout for /reports: keeps the primary nav at five items while
 * exposing the nutrition report and the diet-quality module as tabs.
 */
export default function ReportsLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const active: ReportTab = pathname.startsWith('/reports/quality') ? 'quality' : 'nutrition'

  return (
    <div className="space-y-5">
      <Tabs<ReportTab>
        tabs={[
          { value: 'nutrition', label: 'Nutrición' },
          { value: 'quality', label: 'Calidad de dieta' },
        ]}
        value={active}
        onChange={(tab) => navigate(tab === 'quality' ? '/reports/quality' : '/reports')}
      />
      <Outlet />
    </div>
  )
}
