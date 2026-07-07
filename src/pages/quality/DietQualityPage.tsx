import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { clsx } from 'clsx'
import { AlertTriangle, ClipboardList, Target } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'
import { dietQualityApi } from '@/api/dietQuality'
import type {
  DietQualityFocusCandidate,
  DietQualityGoal,
  DietQualityGoalProgress,
  DietQualitySummary,
  GetDietQualitySummaryPeriod,
} from '@/api/generated/model'
import { type ApiError, normalizeApiError } from '@/api/errors'
import DietQualityGoalModal from './DietQualityGoalModal'
import DietQualityCheckInModal from './DietQualityCheckInModal'
import { ALCOHOL_NOTICE, COMPARISON_LABELS, NO_DATA_COPY, QUALITY_DISCLAIMER, QUALITY_HEADER_SUBTITLE, QUALITY_HEADER_TITLE, UNIT_LABELS } from './copy'

const PERIODS: { value: GetDietQualitySummaryPeriod; label: string }[] = [
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 180, label: '180 días' },
  { value: 365, label: '365 días' },
]

export default function DietQualityPage() {
  const navigate = useNavigate()
  const { show } = useToast()

  const [period, setPeriod] = useState<GetDietQualitySummaryPeriod>(90)
  const [summary, setSummary] = useState<DietQualitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [candidate, setCandidate] = useState<DietQualityFocusCandidate | null>(null)
  const [checkInGoal, setCheckInGoal] = useState<DietQualityGoal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<DietQualityGoal | null>(null)

  const load = useCallback(async (p: GetDietQualitySummaryPeriod) => {
    setLoading(true)
    setError(null)
    try {
      setSummary(await dietQualityApi.summary(p))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(period)
  }, [period, load])

  const changeGoalStatus = async (goal: DietQualityGoal, status: 'active' | 'paused' | 'completed' | 'archived') => {
    try {
      await dietQualityApi.updateGoalStatus(goal.id, status)
      show({ variant: 'success', message: 'Meta actualizada.' })
      load(period)
    } catch (err) {
      show({ variant: 'error', message: normalizeApiError(err).message })
    }
  }

  const deleteGoal = async () => {
    if (!goalToDelete) return
    try {
      await dietQualityApi.deleteGoal(goalToDelete.id)
      show({ variant: 'success', message: 'Meta eliminada.' })
      setGoalToDelete(null)
      load(period)
    } catch (err) {
      show({ variant: 'error', message: normalizeApiError(err).message })
    }
  }

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={error.kind === 'consent_required' ? 'Consentimiento requerido' : 'No fue posible cargar la información'}
        description={error.message}
        action={<Button onClick={() => load(period)}>Reintentar</Button>}
      />
    )
  }

  if (!summary) return <PageSpinner />

  const latest = summary.latest_assessment
  const activeGoals = summary.active_goals
  const progressByGoal = new Map(summary.goal_progress.map((p) => [p.goal_id, p]))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{QUALITY_HEADER_TITLE}</h1>
          <p className="max-w-xl text-sm text-muted">{QUALITY_HEADER_SUBTITLE}</p>
        </div>
        <Button onClick={() => navigate('/reports/quality/assessment')}>{latest ? 'Nueva evaluación' : 'Comenzar evaluación'}</Button>
      </div>

      <p className="text-xs text-muted">{QUALITY_DISCLAIMER}</p>

      {!latest ? (
        <EmptyState
          icon={ClipboardList}
          title="Aún no tienes evaluaciones"
          description="Responde el cuestionario MEDAS-14 para describir cómo se alinean tus hábitos con el instrumento."
          action={<Button onClick={() => navigate('/reports/quality/assessment')}>Comenzar evaluación</Button>}
        />
      ) : (
        <>
          {/* Último puntaje */}
          <Card className="space-y-2">
            <CardHeader title="Puntaje MEDAS-14" />
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="tabular-nums text-4xl font-bold text-foreground">
                {latest.score}/{latest.max_score}
              </p>
              {summary.score_delta !== null && (
                <span className="text-sm text-muted">
                  {summary.score_delta === 0
                    ? 'Sin cambio respecto a tu evaluación anterior'
                    : `${summary.score_delta > 0 ? '+' : ''}${summary.score_delta} respecto a tu evaluación anterior`}
                </span>
              )}
            </div>
            <p className="text-sm text-muted">
              Evaluado el {dayjs(latest.completed_local_date).format('D MMM YYYY')}
              {summary.assessment_age_days !== null && ` · hace ${summary.assessment_age_days} días`}
            </p>
            {summary.can_retake && <p className="text-sm text-muted">Puedes repetir el cuestionario cuando quieras para actualizar tu registro.</p>}
            <Link to={`/reports/quality/assessments/${latest.id}`} className="text-sm font-medium text-primary hover:underline">
              Ver detalle de la evaluación
            </Link>
          </Card>

          {/* Historial */}
          <Card>
            <CardHeader title="Historial de puntaje" />
            <div className="mb-3 flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={clsx(
                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    period === p.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {summary.history.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{NO_DATA_COPY}</p>
            ) : (
              <>
                <div className="h-48 w-full" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={summary.history.map((h) => ({
                        date: dayjs(h.completed_local_date).format('D MMM'),
                        score: h.score,
                      }))}
                      margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
                    >
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 14]} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(value) => [`${value}/14`, 'Puntaje']}
                      />
                      {/* Puntos discretos: cada evaluación es un registro, no se interpola una tendencia */}
                      <Line type="linear" dataKey="score" stroke="var(--color-primary)" strokeWidth={0} dot={{ r: 4 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <table className="mt-3 min-w-full text-sm">
                  <caption className="sr-only">Historial de evaluaciones MEDAS-14</caption>
                  <thead className="text-left text-xs font-medium uppercase text-muted">
                    <tr>
                      <th className="py-1.5">Fecha</th>
                      <th className="py-1.5 text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.history.map((h) => (
                      <tr key={h.assessment_id}>
                        <td className="py-1.5">
                          <Link to={`/reports/quality/assessments/${h.assessment_id}`} className="text-primary hover:underline">
                            {dayjs(h.completed_local_date).format('D MMM YYYY')}
                          </Link>
                        </td>
                        <td className="tabular-nums py-1.5 text-right">
                          {h.score}/{h.max_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Card>

          {/* Focos sugeridos */}
          <Card className="space-y-3">
            <CardHeader title="Focos opcionales" subtitle="Componentes del instrumento que no coincidieron en tu última evaluación." />
            <p className="text-xs text-muted" role="note">
              {ALCOHOL_NOTICE}
            </p>
            {summary.focus_candidates.length === 0 ? (
              <p className="text-sm text-muted">No hay focos sugeridos en tu última evaluación.</p>
            ) : (
              <ul className="space-y-2">
                {summary.focus_candidates.map((c) => (
                  <li key={c.focus_code} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted">{c.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setCandidate(c)}>
                      Elegir como meta
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* Metas */}
      <Card className="space-y-3">
        <CardHeader title="Metas de hábitos" subtitle={`Metas activas: ${activeGoals.length} de 3.`} />
        {activeGoals.length === 0 ? (
          <EmptyState icon={Target} title="Sin metas activas" description="Puedes elegir una meta opcional desde los focos de tu última evaluación." />
        ) : (
          <ul className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                progress={progressByGoal.get(goal.id) ?? null}
                onCheckIn={() => setCheckInGoal(goal)}
                onPause={() => changeGoalStatus(goal, 'paused')}
                onComplete={() => changeGoalStatus(goal, 'completed')}
                onArchive={() => changeGoalStatus(goal, 'archived')}
                onDelete={() => setGoalToDelete(goal)}
              />
            ))}
          </ul>
        )}
        <PausedGoals onReactivate={(g) => changeGoalStatus(g, 'active')} onDelete={(g) => setGoalToDelete(g)} reloadKey={summary} />
      </Card>

      <DietQualityGoalModal candidate={candidate} sourceAssessmentId={latest?.id ?? null} onClose={() => setCandidate(null)} onCreated={() => load(period)} />
      <DietQualityCheckInModal goal={checkInGoal} onClose={() => setCheckInGoal(null)} onSaved={() => load(period)} />
      <ConfirmDialog
        open={goalToDelete !== null}
        title="Eliminar meta"
        description="Se eliminarán la meta y sus registros. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={deleteGoal}
        onClose={() => setGoalToDelete(null)}
      />
    </div>
  )
}

function GoalRow({
  goal,
  progress,
  onCheckIn,
  onPause,
  onComplete,
  onArchive,
  onDelete,
}: {
  goal: DietQualityGoal
  progress: DietQualityGoalProgress | null
  onCheckIn: () => void
  onPause: () => void
  onComplete: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const unitLabel = UNIT_LABELS[goal.unit] ?? goal.unit

  return (
    <li className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{goal.title}</p>
          <p className="text-xs text-muted">{goal.description}</p>
        </div>
        <Badge>{goal.period === 'week' ? 'Semanal' : 'Diaria'}</Badge>
      </div>

      {progress && (
        <div className="rounded-lg bg-surface-muted p-2.5 text-sm">
          <p className="text-foreground">
            {COMPARISON_LABELS[progress.comparison] ?? progress.comparison}
            {progress.comparison === 'no_data' && ` — ${NO_DATA_COPY}`}
          </p>
          <p className="tabular-nums text-xs text-muted">
            Registrado: {progress.recorded_value ?? '—'} / referencia{' '}
            {goal.direction === 'at_most' ? `menos de ${progress.target_value}` : progress.target_value} {unitLabel} · cobertura {progress.coverage_pct}% (
            {progress.data_points}/{progress.expected_data_points} días)
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onCheckIn}>
          Registrar
        </Button>
        <Button size="sm" variant="secondary" onClick={onPause}>
          Pausar
        </Button>
        <Button size="sm" variant="secondary" onClick={onComplete}>
          Completar
        </Button>
        <Button size="sm" variant="ghost" onClick={onArchive}>
          Archivar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </li>
  )
}

/**
 * Paused goals live outside the summary payload (it only carries active
 * goals), so this section fetches the goal list itself.
 */
function PausedGoals({
  onReactivate,
  onDelete,
  reloadKey,
}: {
  onReactivate: (goal: DietQualityGoal) => void
  onDelete: (goal: DietQualityGoal) => void
  reloadKey: unknown
}) {
  const [paused, setPaused] = useState<DietQualityGoal[]>([])

  useEffect(() => {
    let cancelled = false
    dietQualityApi
      .goals()
      .then(({ goals }) => {
        if (!cancelled) setPaused(goals.filter((g) => g.status === 'paused'))
      })
      .catch(() => {
        /* section is optional; summary already surfaced load errors */
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (paused.length === 0) return null

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Metas en pausa</p>
      <ul className="space-y-2">
        {paused.map((goal) => (
          <li key={goal.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <p className="text-sm text-foreground">{goal.title}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onReactivate(goal)}>
                Reactivar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(goal)}>
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
