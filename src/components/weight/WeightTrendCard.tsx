import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Minus, Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { weightApi } from '@/api/weight'
import type { GetWeightProgress200 } from '@/api/generated/model'
import { useToast } from '@/components/ui/toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'

export default function WeightTrendCard() {
  const { show } = useToast()
  const [progress, setProgress] = useState<GetWeightProgress200 | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => weightApi.progress(30).then(setProgress)

  useEffect(() => {
    load()
  }, [])

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(weightInput)
    if (!value || value <= 0) return
    setSaving(true)
    try {
      // Fecha/hora local del dispositivo — evita atribuir el registro al día
      // equivocado si el reloj del servidor no coincide con el del usuario.
      await weightApi.log({ weight_kg: value, measured_at: dayjs().toISOString() })
      await load()
      setModalOpen(false)
      setWeightInput('')
      show({ variant: 'success', message: 'Peso registrado correctamente.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLatest = async (logId: number) => {
    await weightApi.remove(logId)
    await load()
    show({ variant: 'info', message: 'Registro de peso eliminado.' })
  }

  if (!progress) {
    return (
      <Card>
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }

  const { trend, logs = [] } = progress
  const dailyPoints = trend?.daily_points ?? []
  const latestPoint = dailyPoints.at(-1)
  const latestLog = logs[0]
  const delta = trend?.change?.delta_kg ?? null
  const chartData = dailyPoints.slice(-14).map((p) => ({ ...p, label: dayjs(p.date).format('D MMM') }))

  return (
    <Card>
      <div className="mb-1 flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Scale className="h-4 w-4" /> Peso corporal
          </p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-foreground">{latestPoint ? `${latestPoint.weight_kg} kg` : '—'}</p>
          {delta !== null && (
            <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${delta === 0 ? 'text-muted' : delta < 0 ? 'text-accent' : 'text-warning'}`}>
              {delta === 0 ? <Minus className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {delta === 0 ? 'Sin cambios' : `${Math.abs(delta)} kg`} ({trend?.change?.basis === 'moving_average_7d' ? 'promedio 7 días' : 'últimos registros'})
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {latestLog && (
            <button
              onClick={() => handleDeleteLatest(latestLog.id as number)}
              aria-label="Eliminar el último registro de peso"
              title="Eliminar el último registro"
              className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
            Registrar
          </Button>
        </div>
      </div>

      {dailyPoints.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Aún no hay registros de peso en este período.</p>
      ) : (
        <div className="mt-3 h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--color-muted)' }}
                formatter={(value) => [`${value} kg`, 'Peso']}
              />
              <Area type="monotone" dataKey="weight_kg" stroke="var(--color-primary)" strokeWidth={2} fill="url(#weightFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {trend?.notice && <p className="mt-3 text-xs text-muted">{trend.notice}</p>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar peso de hoy" size="sm">
        <form onSubmit={handleLog} className="space-y-4">
          <Input
            id="weight-input"
            label="Peso (kg)"
            type="number"
            step={0.1}
            min={30}
            max={300}
            autoFocus
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            required
          />
          <Button type="submit" loading={saving} className="w-full">
            Guardar
          </Button>
        </form>
      </Modal>
    </Card>
  )
}
