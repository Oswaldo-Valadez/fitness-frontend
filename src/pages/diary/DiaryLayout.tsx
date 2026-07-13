import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Tabs from '@/components/ui/Tabs'

type DiaryTab = 'meals' | 'water'

/**
 * Shared layout for /diary: keeps the primary nav unchanged while exposing
 * hydration as a tab alongside meals (spec: no sixth primary nav item).
 */
export default function DiaryLayout() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  const active: DiaryTab = pathname.startsWith('/diary/water') ? 'water' : 'meals'

  const destinations: Record<DiaryTab, string> = {
    meals: '/diary',
    water: '/diary/water',
  }

  return (
    <div className="space-y-5">
      <Tabs<DiaryTab>
        tabs={[
          { value: 'meals', label: 'Comidas' },
          { value: 'water', label: 'Agua' },
        ]}
        value={active}
        onChange={(tab) => navigate({ pathname: destinations[tab], search })}
      />
      <Outlet />
    </div>
  )
}
