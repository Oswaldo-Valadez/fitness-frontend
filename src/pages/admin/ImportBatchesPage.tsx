import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { PackageOpen } from 'lucide-react'
import { importBatchesApi } from '@/api/adminAdvanced'
import type { FoodImportBatch } from '@/api/generated/model'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'neutral' | 'warning'> = {
  completed: 'success',
  failed: 'danger',
  running: 'warning',
  pending: 'neutral',
  cancelled: 'neutral',
}

export default function ImportBatchesPage() {
  const [batches, setBatches] = useState<FoodImportBatch[] | null>(null)

  useEffect(() => {
    importBatchesApi.list().then((page) => setBatches(page.data))
  }, [])

  if (!batches) return <PageSpinner />

  if (batches.length === 0) {
    return <EmptyState icon={PackageOpen} title="Sin importaciones" description="Los lotes de importación (FDC o CSV) aparecerán aquí." />
  }

  return (
    <div className="space-y-2">
      {batches.map((b) => (
        <Card key={b.id} padding="sm" className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{b.filename ?? `${b.source} (${b.mode})`}</p>
            <p className="text-xs text-muted">
              {b.started_at ? dayjs(b.started_at).format('D MMM YYYY, HH:mm') : '—'}
              {b.initiated_by && typeof b.initiated_by === 'object' && 'name' in b.initiated_by ? ` · ${(b.initiated_by as { name: string }).name}` : ''}
            </p>
          </div>
          <div className="tabular-nums flex gap-3 text-xs text-muted">
            <span>
              {b.processed_rows ?? 0}/{b.total_rows ?? '—'}
            </span>
            <span className="text-accent">+{b.created_rows ?? 0}</span>
            <span className="text-primary">~{b.updated_rows ?? 0}</span>
            <span className="text-destructive">✗{b.failed_rows ?? 0}</span>
          </div>
          <Badge variant={STATUS_VARIANT[b.status ?? ''] ?? 'neutral'}>{b.status}</Badge>
        </Card>
      ))}
    </div>
  )
}
