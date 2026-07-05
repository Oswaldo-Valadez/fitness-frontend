import { getReports } from '@/api/generated/reports/reports'
import type { GetNutritionReportParams, NutritionReport } from '@/api/generated/model'

export const reportsApi = {
  async get(params: GetNutritionReportParams): Promise<NutritionReport> {
    return getReports().getNutritionReport(params)
  },

  /** Triggers a browser download — the backend streams a JSON file, not just the report object. */
  async downloadJson(): Promise<void> {
    const report = await getReports().exportNutritionReportJson()
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    triggerDownload(blob, `reporte-nutricion-${report.start_date}-${report.end_date}.json`)
  },

  async downloadCsv(startDate: string, endDate: string): Promise<void> {
    const blob = await getReports().exportNutritionReportCsv()
    triggerDownload(blob, `reporte-nutricion-${startDate}-${endDate}.csv`)
  },
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
