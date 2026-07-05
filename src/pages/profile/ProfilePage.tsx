import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Flame, Ruler, Weight as WeightIcon } from 'lucide-react'
import { profileApi } from '@/api/profile'
import { weightApi } from '@/api/weight'
import type { NutritionTarget, UserProfile } from '@/types/models'
import ProfileStep from '@/pages/onboarding/ProfileStep'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import StatCard from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/toast'
import WeightTrendCard from '@/components/weight/WeightTrendCard'

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Reducir peso',
  maintain: 'Mantener peso',
  gain_weight: 'Aumentar masa',
}

type TabKey = 'overview' | 'body' | 'history'

export default function ProfilePage() {
  const { show } = useToast()
  const [tab, setTab] = useState<TabKey>('overview')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [targets, setTargets] = useState<NutritionTarget[]>([])
  const [targetPage, setTargetPage] = useState(1)
  const [targetLastPage, setTargetLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)

  const loadTargets = async (page: number) => {
    const res = await profileApi.targets(page)
    setTargets(res.data)
    setTargetLastPage(res.meta.last_page)
  }

  useEffect(() => {
    const id = setTimeout(() => {
      loadTargets(1)
    }, 0)
    profileApi.get().then(({ profile: p }) => {
      setProfile(p)
      setLoading(false)
    })
    weightApi.progress(30).then((p) => setCurrentWeight(p.trend?.daily_points?.at(-1)?.weight_kg ?? null))
    return () => clearTimeout(id)
  }, [])

  const handleSaved = async () => {
    const { profile: p } = await profileApi.get()
    setProfile(p)
    setEditing(false)
    setTab('overview')
    loadTargets(1)
    show({ variant: 'success', message: 'Perfil actualizado correctamente.' })
  }

  if (loading) return <PageSpinner />

  const activeTarget = targets.find((t) => !t.effective_to) ?? targets[0]
  const bmi = profile ? profile.weight_kg / (profile.height_cm / 100) ** 2 : null

  const chartTargets = [...targets]
    .filter((t) => t.target_kcal)
    .sort((a, b) => a.effective_from.localeCompare(b.effective_from))
    .map((t) => ({ date: dayjs(t.effective_from).format('D MMM'), kcal: Math.round(Number(t.target_kcal)) }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        {tab === 'body' && !editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Resumen' },
          { value: 'body', label: 'Cuerpo y objetivo' },
          { value: 'history', label: 'Historial' },
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v)
          setEditing(false)
        }}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={WeightIcon} label="Peso actual" value={currentWeight ? `${currentWeight} kg` : '—'} tone="primary" />
            <StatCard icon={Ruler} label="IMC" value={bmi ? bmi.toFixed(1) : '—'} hint={bmi ? bmiCategory(bmi) : undefined} tone="accent" />
            <StatCard icon={Flame} label="Meta calórica" value={activeTarget?.target_kcal ? `${Math.round(Number(activeTarget.target_kcal))} kcal` : '—'} />
            <StatCard
              icon={Activity}
              label="Gasto energético (TDEE)"
              value={activeTarget?.tdee_kcal ? `${Math.round(Number(activeTarget.tdee_kcal))} kcal` : '—'}
            />
          </div>
          <WeightTrendCard />
        </div>
      )}

      {tab === 'body' &&
        (editing ? (
          <ProfileStep
            api={{ saveProfile: (p: Parameters<typeof profileApi.update>[0]) => profileApi.update(p) }}
            onSaved={handleSaved}
            initialValues={profile ?? undefined}
            submitLabel="Guardar cambios"
          />
        ) : profile ? (
          <Card className="space-y-1">
            <Row label="Sexo" value={{ male: 'Masculino', female: 'Femenino', undisclosed: 'No indicado' }[profile.sex_for_equation]} />
            <Row label="Fecha de nacimiento" value={dayjs(profile.birth_date).format('D [de] MMMM [de] YYYY')} />
            <Row label="Estatura" value={`${profile.height_cm} cm`} />
            <Row label="Peso registrado" value={`${profile.weight_kg} kg`} />
            <Row label="Nivel de actividad" value={ACTIVITY_LABELS[profile.activity_level] ?? profile.activity_level} />
            <Row label="Objetivo" value={GOAL_LABELS[profile.goal] ?? profile.goal} />
            <Row label="Macros" value={`P ${profile.protein_percentage}% / C ${profile.carbohydrate_percentage}% / G ${profile.fat_percentage}%`} />
          </Card>
        ) : (
          <p className="text-muted">Sin perfil registrado.</p>
        ))}

      {tab === 'history' && (
        <div className="space-y-4">
          {chartTargets.length >= 2 && (
            <Card>
              <CardHeader title="Meta calórica a lo largo del tiempo" />
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartTargets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(value) => [`${value} kcal`, 'Meta']}
                    />
                    <Line type="monotone" dataKey="kcal" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {targets.length > 0 ? (
            <div className="space-y-3">
              {targets.map((t) => (
                <Card key={t.id} padding="sm" className={!t.effective_to ? 'border-primary/30 bg-primary/5' : undefined}>
                  <div className="mb-2 flex justify-between text-xs text-muted">
                    <span>Desde {dayjs(t.effective_from).format('DD/MM/YYYY')}</span>
                    <span>{t.effective_to ? `Hasta ${dayjs(t.effective_to).format('DD/MM/YYYY')}` : '✓ Activo'}</span>
                  </div>
                  {t.target_kcal ? (
                    <div className="tabular-nums flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        <strong>{Number(t.target_kcal).toFixed(0)}</strong> kcal
                      </span>
                      <span className="text-protein">P {Number(t.protein_grams).toFixed(0)}g</span>
                      <span className="text-carbs">C {Number(t.carbohydrate_grams).toFixed(0)}g</span>
                      <span className="text-fat">G {Number(t.fat_grams).toFixed(0)}g</span>
                    </div>
                  ) : (
                    <span className="italic text-muted">No calculable (sexo no indicado)</span>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-muted">Aún no hay historial de objetivos.</p>
          )}

          {targetLastPage > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={targetPage === 1}
                onClick={() => {
                  const p = targetPage - 1
                  setTargetPage(p)
                  loadTargets(p)
                }}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={targetPage === targetLastPage}
                onClick={() => {
                  const p = targetPage + 1
                  setTargetPage(p)
                  loadTargets(p)
                }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso'
  if (bmi < 25) return 'Peso saludable'
  if (bmi < 30) return 'Sobrepeso'
  return 'Obesidad'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
