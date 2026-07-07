import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowLeft, Check, FileSearch, Minus } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'
import { type DietQualityAssessment, dietQualityApi } from '@/api/dietQuality'
import { type ApiError, normalizeApiError } from '@/api/errors'
import { QUALITY_DISCLAIMER, UNIT_LABELS } from './copy'

/** Snapshot view of a historical assessment: score, 14 components, sources and limitations. */
export default function DietQualityAssessmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { show } = useToast()

  const [assessment, setAssessment] = useState<DietQualityAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAssessment(await dietQualityApi.assessment(Number(id)))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleDelete = async () => {
    if (!assessment) return
    try {
      await dietQualityApi.deleteAssessment(assessment.id)
      show({ variant: 'success', message: 'Evaluación eliminada.' })
      navigate('/reports/quality', { replace: true })
    } catch (err) {
      show({ variant: 'error', message: normalizeApiError(err).message })
    }
  }

  if (loading) return <PageSpinner />

  if (error || !assessment) {
    return (
      <EmptyState
        icon={FileSearch}
        title={error?.kind === 'not_found' ? 'Esta evaluación ya no existe' : 'No fue posible cargar la evaluación'}
        description={error?.kind === 'not_found' ? 'Pudo haber sido eliminada.' : error?.message}
        action={
          <Button variant="secondary" onClick={() => navigate('/reports/quality')}>
            Volver a calidad de dieta
          </Button>
        }
      />
    )
  }

  const sourceEntries = Object.values(assessment.source ?? {}).filter(
    (s): s is { citation?: string; doi?: string; pubmed?: string; url?: string } => typeof s === 'object' && s !== null,
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reports/quality')}>
          Volver
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
          Eliminar evaluación
        </Button>
      </div>

      <Card className="space-y-1">
        <CardHeader
          title="Puntaje MEDAS-14"
          subtitle={`Instrumento ${assessment.instrument_code} v${assessment.instrument_version} (${assessment.instrument_locale})`}
        />
        <p className="tabular-nums text-4xl font-bold text-foreground">
          {assessment.score}/{assessment.max_score}
        </p>
        <p className="text-sm text-muted">Completado el {dayjs(assessment.completed_local_date).format('D MMM YYYY')}</p>
        <p className="text-xs text-muted">{QUALITY_DISCLAIMER}</p>
      </Card>

      {assessment.safety_notices.length > 0 && (
        <div role="note" className="rounded-lg border border-border bg-surface-muted p-3">
          {assessment.safety_notices.map((notice) => (
            <p key={notice} className="text-sm text-foreground">
              {notice}
            </p>
          ))}
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">Componentes del instrumento y puntos obtenidos</caption>
            <thead className="bg-surface-muted text-left text-xs font-medium uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Componente</th>
                <th className="px-4 py-3 text-right">Respuesta</th>
                <th className="px-4 py-3 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assessment.items.map((item) => (
                <tr key={item.question_code}>
                  <td className="px-4 py-2.5">
                    <p className="text-foreground">{item.prompt}</p>
                    {item.safety_excluded && (
                      <Badge size="sm" className="mt-1">
                        Sin sugerencias por seguridad
                      </Badge>
                    )}
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right">
                    {typeof item.answer === 'boolean' ? (item.answer ? 'Sí' : 'No') : `${item.answer} ${item.unit ? (UNIT_LABELS[item.unit] ?? '') : ''}`}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      {item.met ? <Check className="h-4 w-4 text-accent" aria-hidden="true" /> : <Minus className="h-4 w-4 text-muted" aria-hidden="true" />}
                      {item.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-3">
        <CardHeader title="Fuentes y limitaciones" />
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {assessment.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
        {sourceEntries.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3">
            {sourceEntries.map((source, index) =>
              source.citation ? (
                <p key={index} className="text-xs text-muted">
                  {source.citation}
                </p>
              ) : null,
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar evaluación"
        description="Se eliminará esta evaluación y sus respuestas. Las metas creadas a partir de ella conservan su información."
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}
