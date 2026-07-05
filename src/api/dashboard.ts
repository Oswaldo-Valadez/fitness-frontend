import { getDashboard } from '@/api/generated/dashboard/dashboard'
import type { DashboardSummary } from '@/api/generated/model'

export const dashboardApi = {
  async getSummary(date: string): Promise<DashboardSummary> {
    return getDashboard().getDashboard({ date })
  },
}

export type { DashboardSummary }
