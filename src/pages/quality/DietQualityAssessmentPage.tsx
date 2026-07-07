import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wine } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageSpinner from '@/components/ui/PageSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { dietQualityApi } from '@/api/dietQuality'
import type { DietQualityInstrument, DietQualityQuestion, Medas14Answers } from '@/api/generated/model'
import { normalizeApiError } from '@/api/errors'
import { isAxiosError } from 'axios'
import { ALCOHOL_NOTICE, QUALITY_DISCLAIMER, UNIT_LABELS } from './copy'

/** In-memory only — answers are sensitive and are never written to localStorage. */
type DraftAnswers = Record<string, boolean | string>

export default function DietQualityAssessmentPage() {
  const navigate = useNavigate()
  const { show } = useToast()

  const [instrument, setInstrument] = useState<DietQualityInstrument | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [step, setStep] = useState(0) // 0..13 questions, 14 = review
  const [answers, setAnswers] = useState<DraftAnswers>({})
  const [stepError, setStepError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [versionRefreshed, setVersionRefreshed] = useState(false)

  const loadInstrument = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setInstrument(await dietQualityApi.instrument())
    } catch (err) {
      setLoadError(normalizeApiError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInstrument()
  }, [loadInstrument])

  const questions = useMemo(() => instrument?.questions ?? [], [instrument])
  const total = questions.length
  const isReview = step >= total
  const question = isReview ? null : questions[step]

  const setAnswer = (code: string, value: boolean | string) => {
    setAnswers((prev) => ({ ...prev, [code]: value }))
    setStepError(null)
  }

  const validate = (q: DietQualityQuestion): string | null => {
    const raw = answers[q.code]
    if (q.answer_type === 'boolean') {
      return typeof raw === 'boolean' ? null : 'Selecciona una opción para continuar.'
    }
    if (typeof raw !== 'string' || raw.trim() === '') return 'Ingresa un número para continuar.'
    const num = Number(raw)
    if (Number.isNaN(num) || !Number.isFinite(num)) return 'Ingresa un número válido.'
    if (num < 0) return 'El valor no puede ser negativo.'
    if (q.max_value !== null && num > q.max_value) return `El valor máximo aceptado es ${q.max_value}.`
    return null
  }

  const handleNext = () => {
    if (!question) return
    const error = validate(question)
    if (error) {
      setStepError(error)
      return
    }
    setStep((s) => s + 1)
  }

  const buildPayload = (): Medas14Answers => {
    const payload: Record<string, boolean | number> = {}
    for (const q of questions) {
      const raw = answers[q.code]
      payload[q.code] = q.answer_type === 'boolean' ? raw === true : Number(raw)
    }
    return payload as unknown as Medas14Answers
  }

  const handleSubmit = async () => {
    if (!instrument) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const assessment = await dietQualityApi.createAssessment(instrument.code, instrument.version, buildPayload())
      show({ variant: 'success', message: 'Evaluación registrada.' })
      navigate(`/reports/quality/assessments/${assessment.id}`, { replace: true })
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409 && err.response.data?.code === 'INSTRUMENT_VERSION_OUTDATED') {
        // Reload the instrument; compatible answers stay in memory and the
        // user must review them before re-submitting.
        const fresh = await dietQualityApi.instrument()
        setInstrument(fresh)
        setAnswers((prev) => {
          const kept: DraftAnswers = {}
          for (const q of fresh.questions) {
            if (q.code in prev) kept[q.code] = prev[q.code]
          }
          return kept
        })
        setStep(0)
        setVersionRefreshed(true)
        setSubmitError('La versión del cuestionario cambió. Revisa tus respuestas antes de volver a enviarlas.')
      } else {
        setSubmitError(normalizeApiError(err).message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner />

  if (loadError || !instrument) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No fue posible cargar el cuestionario"
        description={loadError ?? undefined}
        action={<Button onClick={loadInstrument}>Reintentar</Button>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reports/quality')}>
          Salir
        </Button>
        <h1 className="text-xl font-bold text-foreground">{instrument.name}</h1>
      </div>

      <p className="text-sm text-muted">{QUALITY_DISCLAIMER}</p>

      {versionRefreshed && (
        <p role="alert" className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-foreground">
          La versión del cuestionario se actualizó a {instrument.version}. Tus respuestas compatibles se conservaron; revísalas antes de enviar.
        </p>
      )}

      {!isReview && question && (
        <Card className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Pregunta {step + 1} de {total}
          </p>

          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-foreground">{question.prompt}</legend>
            {question.helper_text && !question.safety_excluded && <p className="text-sm text-muted">{question.helper_text}</p>}

            {question.safety_excluded && (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted p-3" role="note">
                <Wine className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <p className="text-sm text-foreground">{ALCOHOL_NOTICE}</p>
              </div>
            )}

            {question.answer_type === 'boolean' ? (
              <div className="flex gap-2">
                <Button variant={answers[question.code] === true ? 'primary' : 'secondary'} onClick={() => setAnswer(question.code, true)}>
                  Sí
                </Button>
                <Button variant={answers[question.code] === false ? 'primary' : 'secondary'} onClick={() => setAnswer(question.code, false)}>
                  No
                </Button>
              </div>
            ) : (
              <Input
                id={`answer-${question.code}`}
                label={question.unit ? `Cantidad (${UNIT_LABELS[question.unit] ?? question.unit})` : 'Cantidad'}
                type="text"
                inputMode="decimal"
                value={typeof answers[question.code] === 'string' ? (answers[question.code] as string) : ''}
                onChange={(e) => setAnswer(question.code, e.target.value)}
                error={stepError ?? undefined}
              />
            )}
          </fieldset>

          {stepError && question.answer_type === 'boolean' && (
            <p role="alert" className="text-sm text-danger">
              {stepError}
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Atrás
            </Button>
            <Button onClick={handleNext}>{step === total - 1 ? 'Revisar respuestas' : 'Siguiente'}</Button>
          </div>
        </Card>
      )}

      {isReview && (
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Revisa tus respuestas</h2>
          <ul className="divide-y divide-border">
            {questions.map((q, index) => (
              <li key={q.code} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{q.prompt}</p>
                  <p className="tabular-nums text-sm font-medium text-foreground">
                    {q.answer_type === 'boolean'
                      ? answers[q.code] === true
                        ? 'Sí'
                        : 'No'
                      : `${answers[q.code] ?? '—'} ${q.unit ? (UNIT_LABELS[q.unit] ?? q.unit) : ''}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(index)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>

          {submitError && (
            <p role="alert" className="text-sm text-danger">
              {submitError}
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(total - 1)}>
              Atrás
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              Enviar evaluación
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
