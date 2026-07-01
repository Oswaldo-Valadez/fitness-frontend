import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { ProfilePayload } from '@/api/profile'

interface Props {
  onSaved: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any
  initialValues?: Partial<ProfilePayload>
  submitLabel?: string
}

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentario (sin ejercicio)' },
  { value: 'light', label: 'Ligero (1-3 días/semana)' },
  { value: 'moderate', label: 'Moderado (3-5 días/semana)' },
  { value: 'active', label: 'Activo (6-7 días/semana)' },
  { value: 'very_active', label: 'Muy activo (ejercicio intenso diario)' },
]

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Reducir peso' },
  { value: 'maintain', label: 'Mantener peso' },
  { value: 'gain_weight', label: 'Aumentar masa' },
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

  const set = <K extends keyof ProfilePayload>(k: K, v: ProfilePayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

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
    <div className="rounded-2xl bg-white p-8 shadow-md space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tu perfil físico</h2>
        <p className="mt-1 text-sm text-gray-500">
          Usamos estos datos para calcular tus requerimientos energéticos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sexo para la ecuación */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Sexo (para la ecuación)</label>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={form.sex_for_equation}
            onChange={(e) => set('sex_for_equation', e.target.value as ProfilePayload['sex_for_equation'])}
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="undisclosed">Prefiero no indicarlo</option>
          </select>
          {errors.sex_for_equation && <p className="text-xs text-red-600">{errors.sex_for_equation}</p>}
        </div>

        <Input id="birth_date" label="Fecha de nacimiento" type="date"
          value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)}
          error={errors.birth_date} required />

        <div className="grid grid-cols-2 gap-4">
          <Input id="height_cm" label="Estatura (cm)" type="number" min={100} max={250} step={0.1}
            value={form.height_cm} onChange={(e) => set('height_cm', Number(e.target.value))}
            error={errors.height_cm} required />
          <Input id="weight_kg" label="Peso (kg)" type="number" min={30} max={300} step={0.1}
            value={form.weight_kg} onChange={(e) => set('weight_kg', Number(e.target.value))}
            error={errors.weight_kg} required />
        </div>

        {/* Nivel de actividad */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Nivel de actividad</label>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={form.activity_level}
            onChange={(e) => set('activity_level', e.target.value as ProfilePayload['activity_level'])}
          >
            {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Objetivo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Objetivo</label>
          <div className="flex gap-3">
            {GOAL_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="goal" value={o.value}
                  checked={form.goal === o.value}
                  onChange={() => set('goal', o.value as ProfilePayload['goal'])}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Distribución de macros{' '}
            <span className={macroSum === 100 ? 'text-emerald-600' : 'text-red-500'}>
              ({macroSum}%)
            </span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Input id="protein_pct" label="Proteína %" type="number" min={10} max={60}
              value={form.protein_percentage}
              onChange={(e) => set('protein_percentage', Number(e.target.value))}
              error={errors.protein_percentage} required />
            <Input id="carbs_pct" label="Carbos %" type="number" min={10} max={70}
              value={form.carbohydrate_percentage}
              onChange={(e) => set('carbohydrate_percentage', Number(e.target.value))}
              error={errors.carbohydrate_percentage} required />
            <Input id="fat_pct" label="Grasa %" type="number" min={10} max={60}
              value={form.fat_percentage}
              onChange={(e) => set('fat_percentage', Number(e.target.value))}
              error={errors.fat_percentage} required />
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {submitLabel}
        </Button>
      </form>
    </div>
  )
}
