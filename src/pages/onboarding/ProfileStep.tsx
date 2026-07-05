import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SegmentedControl from '@/components/ui/SegmentedControl'
import type { ProfilePayload } from '@/api/profile'

interface Props {
  onSaved: () => void

  api: any
  initialValues?: Partial<ProfilePayload>
  submitLabel?: string
}

const SEX_OPTIONS = [
  { value: 'male' as const, label: 'Masculino' },
  { value: 'female' as const, label: 'Femenino' },
  { value: 'undisclosed' as const, label: 'Prefiero no indicarlo' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentario', description: 'Sin ejercicio regular' },
  { value: 'light', label: 'Ligero', description: '1-3 días de ejercicio/semana' },
  { value: 'moderate', label: 'Moderado', description: '3-5 días de ejercicio/semana' },
  { value: 'active', label: 'Activo', description: '6-7 días de ejercicio/semana' },
  { value: 'very_active', label: 'Muy activo', description: 'Ejercicio intenso diario' },
]

const GOAL_OPTIONS = [
  { value: 'lose_weight' as const, label: 'Reducir peso' },
  { value: 'maintain' as const, label: 'Mantener peso' },
  { value: 'gain_weight' as const, label: 'Aumentar masa' },
]

const defaults: ProfilePayload = {
  sex_for_equation: 'undisclosed',
  birth_date: '',
  height_cm: 170,
  weight_kg: 70,
  activity_level: 'moderate',
  goal: 'maintain',
  protein_percentage: 25,
  carbohydrate_percentage: 45,
  fat_percentage: 30,
}

export default function ProfileStep({ onSaved, api, initialValues, submitLabel = 'Guardar' }: Props) {
  const [form, setForm] = useState<ProfilePayload>({ ...defaults, ...initialValues })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const macroSum = form.protein_percentage + form.carbohydrate_percentage + form.fat_percentage

  const set = <K extends keyof ProfilePayload>(k: K, v: ProfilePayload[K]) => setForm((f) => ({ ...f, [k]: v }))

  const resetMacros = () => setForm((f) => ({ ...f, protein_percentage: 25, carbohydrate_percentage: 45, fat_percentage: 30 }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (macroSum !== 100) {
      setErrors({ protein_percentage: `Los macros suman ${macroSum}%, deben ser 100%.` })
      return
    }
    setLoading(true)
    try {
      await api.saveProfile(form)
      onSaved()
    } catch (err: unknown) {
      const data = (err as { data?: { errors?: Record<string, string[]> } })?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) flat[k] = v[0]
        setErrors(flat)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="lg" elevated className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tu perfil físico</h2>
        <p className="mt-1 text-sm text-muted">Usamos estos datos para calcular tus requerimientos energéticos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Sexo (para la ecuación)</span>
          <SegmentedControl
            aria-label="Sexo para la ecuación"
            options={SEX_OPTIONS}
            value={form.sex_for_equation}
            onChange={(v) => set('sex_for_equation', v)}
            className="w-full [&>button]:flex-1"
          />
        </div>

        <Input
          id="birth_date"
          label="Fecha de nacimiento"
          type="date"
          value={form.birth_date}
          onChange={(e) => set('birth_date', e.target.value)}
          error={errors.birth_date}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="height_cm"
            label="Estatura (cm)"
            type="number"
            min={100}
            max={250}
            step={0.1}
            value={form.height_cm}
            onChange={(e) => set('height_cm', Number(e.target.value))}
            error={errors.height_cm}
            required
          />
          <Input
            id="weight_kg"
            label="Peso (kg)"
            type="number"
            min={30}
            max={300}
            step={0.1}
            value={form.weight_kg}
            onChange={(e) => set('weight_kg', Number(e.target.value))}
            error={errors.weight_kg}
            required
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Nivel de actividad</legend>
          <div className="grid gap-2">
            {ACTIVITY_OPTIONS.map((o) => {
              const active = form.activity_level === o.value
              return (
                <label
                  key={o.value}
                  className={clsx(
                    'flex cursor-pointer items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm transition-colors',
                    active ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-surface-muted',
                  )}
                >
                  <span>
                    <span className="font-medium text-foreground">{o.label}</span>
                    <span className="ml-2 text-xs text-muted">{o.description}</span>
                  </span>
                  <input
                    type="radio"
                    name="activity_level"
                    className="h-4 w-4 accent-current text-primary"
                    checked={active}
                    onChange={() => set('activity_level', o.value as ProfilePayload['activity_level'])}
                  />
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Objetivo</legend>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_OPTIONS.map((o) => {
              const active = form.goal === o.value
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => set('goal', o.value)}
                  className={clsx(
                    'cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-surface-muted',
                  )}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Distribución de macros <span className={macroSum === 100 ? 'text-accent' : 'text-destructive'}>({macroSum}%)</span>
            </p>
            <button type="button" onClick={resetMacros} className="cursor-pointer text-xs font-medium text-primary hover:underline">
              Restablecer
            </button>
          </div>

          <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="bg-protein transition-all" style={{ width: `${form.protein_percentage}%` }} />
            <div className="bg-carbs transition-all" style={{ width: `${form.carbohydrate_percentage}%` }} />
            <div className="bg-fat transition-all" style={{ width: `${form.fat_percentage}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              id="protein_pct"
              label="Proteína %"
              type="number"
              min={10}
              max={60}
              value={form.protein_percentage}
              onChange={(e) => set('protein_percentage', Number(e.target.value))}
              error={errors.protein_percentage}
              required
            />
            <Input
              id="carbs_pct"
              label="Carbos %"
              type="number"
              min={10}
              max={70}
              value={form.carbohydrate_percentage}
              onChange={(e) => set('carbohydrate_percentage', Number(e.target.value))}
              required
            />
            <Input
              id="fat_pct"
              label="Grasa %"
              type="number"
              min={10}
              max={60}
              value={form.fat_percentage}
              onChange={(e) => set('fat_percentage', Number(e.target.value))}
              required
            />
          </div>
          {errors.protein_percentage && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {errors.protein_percentage}
            </p>
          )}
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {submitLabel}
        </Button>
      </form>
    </Card>
  )
}
