import { useEffect, useState } from 'react'
import { Database, Search } from 'lucide-react'
import { fdcAdminApi } from '@/api/adminAdvanced'
import type { FdcImportSummary, FdcStatus } from '@/api/generated/model'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageSpinner from '@/components/ui/PageSpinner'
import { useToast } from '@/components/ui/toast'

export default function FdcPage() {
  const { show } = useToast()
  const [status, setStatus] = useState<FdcStatus | null>(null)
  const [fdcId, setFdcId] = useState('')
  const [preview, setPreview] = useState<FdcImportSummary | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const load = () => fdcAdminApi.status().then(setStatus)

  useEffect(() => {
    load()
  }, [])

  const handlePreview = async () => {
    if (!fdcId) return
    setError('')
    setLoadingPreview(true)
    setPreview(null)
    try {
      setPreview(await fdcAdminApi.preview(Number(fdcId)))
    } catch {
      setError('No se pudo obtener la vista previa (¿ID inválido o FDC no disponible?).')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleImport = async () => {
    if (!fdcId) return
    setImporting(true)
    try {
      const result = await fdcAdminApi.import(Number(fdcId))
      show({ variant: 'success', message: `Alimento importado: ${result.action}.` })
      setPreview(null)
      setFdcId('')
      load()
    } catch {
      show({ variant: 'error', message: 'No se pudo importar el alimento.' })
    } finally {
      setImporting(false)
    }
  }

  if (!status) return <PageSpinner />

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Estado de la integración" action={<Database className="h-5 w-5 text-primary" />} />
        <div className="flex flex-wrap gap-2">
          <Badge variant={status.enabled ? 'success' : 'neutral'}>{status.enabled ? 'Habilitada' : 'Deshabilitada'}</Badge>
          <Badge variant={status.api_key_configured ? 'success' : 'warning'}>{status.api_key_configured ? 'API key configurada' : 'Sin API key'}</Badge>
          <Badge variant={status.ready ? 'success' : 'danger'}>{status.ready ? 'Lista para usarse' : 'No disponible'}</Badge>
          {status.pending_mappings ? <Badge variant="warning">{status.pending_mappings} mapeos pendientes</Badge> : null}
        </div>
        {status.notes && (
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {status.notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <CardHeader title="Importar alimento por ID de FDC" subtitle="Solo importaciones individuales — las masivas se ejecutan por CLI." />
        <div className="flex items-end gap-3">
          <Input id="fdc-id" label="FDC ID" type="number" value={fdcId} onChange={(e) => setFdcId(e.target.value)} containerClassName="w-40" />
          <Button variant="secondary" iconLeft={<Search className="h-4 w-4" />} loading={loadingPreview} disabled={!status.ready} onClick={handlePreview}>
            Vista previa
          </Button>
        </div>
        {!status.ready && <p className="text-xs text-muted">La integración no está lista — revisa la configuración del servidor.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {preview && (
          <div className="space-y-2 rounded-lg bg-surface-muted p-3 text-sm">
            <p>
              <span className="font-medium text-foreground">{preview.name}</span> — acción: <span className="font-mono text-xs">{preview.action}</span>
            </p>
            <p className="text-xs text-muted">
              Nutrientes mapeados: {preview.mapped} · pendientes: {preview.pending} · porciones: {preview.portions}
            </p>
            <Button size="sm" loading={importing} onClick={handleImport}>
              Confirmar importación
            </Button>
          </div>
        )}
      </Card>

      {status.recent_batches && status.recent_batches.length > 0 && (
        <Card>
          <CardHeader title="Lotes recientes" />
          <ul className="divide-y divide-border text-sm">
            {status.recent_batches.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span className="text-foreground">{b.filename ?? b.mode}</span>
                <div className="flex items-center gap-2">
                  {b.is_dry_run && <Badge variant="neutral">Vista previa (no persistido)</Badge>}
                  <Badge variant={b.status === 'completed' ? 'success' : b.status === 'failed' ? 'danger' : 'neutral'}>{b.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
