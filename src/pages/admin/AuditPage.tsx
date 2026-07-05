import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { ScrollText } from 'lucide-react'
import { auditEventsApi } from '@/api/adminAdvanced'
import type { DataAuditEvent } from '@/api/generated/model'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'

export default function AuditPage() {
  const [eventType, setEventType] = useState('')
  const [events, setEvents] = useState<DataAuditEvent[] | null>(null)

  const load = (type: string) => auditEventsApi.list(type || undefined).then((page) => setEvents(page.data))

  useEffect(() => {
    const id = setTimeout(() => load(eventType), 300)
    return () => clearTimeout(id)
  }, [eventType])

  return (
    <div className="space-y-4">
      <Input
        id="audit-filter"
        placeholder="Filtrar por tipo de evento (ej. nutrient_mapping.updated)..."
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
      />

      {!events ? (
        <PageSpinner />
      ) : events.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Sin eventos"
          description="El registro de auditoría (append-only) aparecerá aquí conforme ocurran cambios administrativos."
        />
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <Card key={e.id} padding="sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-primary">{e.event_type}</span>
                <span className="text-xs text-muted">{dayjs(e.created_at).format('D MMM YYYY, HH:mm:ss')}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {e.actor && typeof e.actor === 'object' && 'name' in e.actor ? (e.actor as { name: string }).name : 'Sistema'}
                {e.subject_type && ` · ${e.subject_type}#${e.subject_id}`}
              </p>
              {e.metadata && Object.keys(e.metadata).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded bg-surface-muted p-2 text-[11px] text-muted">{JSON.stringify(e.metadata, null, 2)}</pre>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
