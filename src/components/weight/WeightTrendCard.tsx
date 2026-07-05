import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Minus, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { type WeightEntry, weightApi } from '@/api/weight'
import { useToast } from '@/components/ui/toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'

export default function WeightTrendCard() {
  const { show } = useToast()
  const [entries, setEntries] = useState<WeightEntry[] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => weightApi.list().then(setEntries)

  useEffect(() => {
    load()
  }, [])

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(weightInput)
    if (!value || value <= 0) return
    setSaving(true)
    try {
      await weightApi.log({ logged_at: dayjs().format('YYYY-MM-DD'), weight_kg: value })
      await load()
      setModalOpen(false)
      setWeightInput('')
      show({ variant: 'success', message: 'Peso registrado correctamente.' })
    } finally {
      setSaving(false)
    }
  }

  if (!entries) {
    return (
      <Card>
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }

  const latest = entries.at(-1)
  const weekAgo = entries.at(-8)
  const delta = latest && weekAgo ? Math.round((latest.weight_kg - weekAgo.weight_kg) * 10) / 10 : null
  const chartData = entries.slice(-14).map((e) => ({ ...e, label: dayjs(e.logged_at).format('D MMM') }))

  return (
    <Card>
      <div className="mb-1 flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Scale className="h-4 w-4" /> Peso corporal
          </p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-foreground">{latest ? `${latest.weight_kg} kg` : '—'}</p>
          {delta !== null && (
            <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${delta === 0 ? 'text-muted' : delta < 0 ? 'text-accent' : 'text-warning'}`}>
              {delta === 0 ? <Minus className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {delta === 0 ? 'Sin cambios' : `${Math.abs(delta)} kg`} vs. hace 7 días
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
          Registrar
        </Button>
      </div>

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
