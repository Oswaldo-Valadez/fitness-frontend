import { useEffect, useState } from 'react'
import { GitMerge } from 'lucide-react'
import { nutrientMappingsApi } from '@/api/adminAdvanced'
import type { ExternalNutrientMapping } from '@/api/generated/model'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'
import { useToast } from '@/components/ui/toast'

const STATUS_VARIANT = { mapped: 'success', pending: 'warning', ignored: 'neutral' } as const

export default function NutrientMappingsPage() {
  const { show } = useToast()
  const [mappings, setMappings] = useState<ExternalNutrientMapping[] | null>(null)

  const load = () => nutrientMappingsApi.list().then((page) => setMappings(page.data))

  useEffect(() => {
    load()
  }, [])

  const handleStatusChange = async (mapping: ExternalNutrientMapping, status: 'mapped' | 'pending' | 'ignored') => {
    if (status === 'mapped' && !mapping.nutrient_id) {
      show({ variant: 'error', message: 'Selecciona un nutriente local antes de marcar como mapeado.' })
      return
    }
    try {
      await nutrientMappingsApi.update(mapping.id as number, { nutrient_id: mapping.nutrient_id, mapping_status: status })
      show({ variant: 'success', message: 'Mapeo actualizado.' })
      load()
    } catch {
      show({ variant: 'error', message: 'No se pudo actualizar — revisa el nutriente seleccionado.' })
    }
  }

  if (!mappings) return <PageSpinner />

  if (mappings.length === 0) {
    return <EmptyState icon={GitMerge} title="Sin mapeos" description="Los nutrientes externos sin mapear aparecerán aquí tras una importación de FDC." />
  }

  return (
    <div className="space-y-2">
      {mappings.map((m) => (
        <Card key={m.id} padding="sm" className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{m.external_name ?? m.external_nutrient_id}</p>
            <p className="text-xs text-muted">
              {m.source} · {m.external_unit ?? 'sin unidad'}
              {m.nutrient_id ? ` · nutriente local #${m.nutrient_id}` : ' · sin nutriente local asignado'}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[m.mapping_status ?? 'pending']}>{m.mapping_status}</Badge>
          <Select
            aria-label={`Estado de mapeo para ${m.external_name}`}
            value={m.mapping_status}
            onChange={(e) => handleStatusChange(m, e.target.value as 'mapped' | 'pending' | 'ignored')}
            className="w-36"
          >
            <option value="pending">Pendiente</option>
            <option value="mapped" disabled={!m.nutrient_id}>
              Mapeado
            </option>
            <option value="ignored">Ignorado</option>
          </Select>
        </Card>
      ))}
    </div>
  )
}
