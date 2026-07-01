import { useState, useEffect } from 'react'
import { profileApi } from '@/api/profile'
import type { UserProfile, NutritionTarget } from '@/types/models'
import ProfileStep from '@/pages/onboarding/ProfileStep'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import dayjs from 'dayjs'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [targets, setTargets] = useState<NutritionTarget[]>([])
  const [targetPage, setTargetPage] = useState(1)
  const [targetLastPage, setTargetLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadTargets = async (page: number) => {
    const res = await profileApi.targets(page)
    setTargets(res.data)
    setTargetLastPage(res.meta.last_page)
  }

  useEffect(() => {
    const id = setTimeout(() => {
      loadTargets(1)
    }, 0)

    profileApi.get().then(({ profile }) => { setProfile(profile); setLoading(false) })

    return () => clearTimeout(id)
  }, [])

  const handleSaved = async () => {
    const { profile: p } = await profileApi.get()
    setProfile(p)
    setEditing(false)
    setSaved(true)
    loadTargets(1)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>Editar</Button>
        )}
      </div>

      {saved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Perfil actualizado correctamente.
        </div>
      )}

      {editing ? (
        <ProfileStep
          api={{ saveProfile: (p: Parameters<typeof profileApi.update>[0]) => profileApi.update(p) }}
          onSaved={handleSaved}
          initialValues={profile ?? undefined}
          submitLabel="Guardar cambios"
        />
      ) : profile ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3 text-sm">
          <Row label="Sexo" value={{ male: 'Masculino', female: 'Femenino', undisclosed: 'No indicado' }[profile.sex_for_equation]} />
          <Row label="Fecha de nacimiento" value={dayjs(profile.birth_date).format('D [de] MMMM [de] YYYY')} />
          <Row label="Estatura" value={`${profile.height_cm} cm`} />
          <Row label="Peso" value={`${profile.weight_kg} kg`} />
          <Row label="Nivel de actividad" value={profile.activity_level} />
          <Row label="Objetivo" value={profile.goal} />
          <Row label="Macros" value={`P ${profile.protein_percentage}% / C ${profile.carbohydrate_percentage}% / G ${profile.fat_percentage}%`} />
        </div>
      ) : (
        <p className="text-gray-400">Sin perfil registrado.</p>
      )}

      {/* Historial de objetivos nutricionales */}
      {targets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Historial de objetivos</h2>
          <div className="space-y-3">
            {targets.map((t) => (
              <div key={t.id} className={`rounded-xl p-4 text-sm shadow-sm ${!t.effective_to ? 'bg-emerald-50 border border-emerald-200' : 'bg-white'}`}>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Desde {dayjs(t.effective_from).format('DD/MM/YYYY')}</span>
                  <span>{t.effective_to ? `Hasta ${dayjs(t.effective_to).format('DD/MM/YYYY')}` : '✓ Activo'}</span>
                </div>
                {t.is_calculable ? (
                  <div className="flex gap-6">
                    <span><strong>{Number(t.target_kcal).toFixed(0)}</strong> kcal</span>
                    <span>P {Number(t.protein_grams).toFixed(0)}g</span>
                    <span>C {Number(t.carbohydrate_grams).toFixed(0)}g</span>
                    <span>G {Number(t.fat_grams).toFixed(0)}g</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No calculable (sexo no indicado)</span>
                )}
              </div>
            ))}
          </div>
          {targetLastPage > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="secondary" disabled={targetPage === 1}
                onClick={() => { const p = targetPage - 1; setTargetPage(p); loadTargets(p) }}>Anterior</Button>
              <Button variant="secondary" disabled={targetPage === targetLastPage}
                onClick={() => { const p = targetPage + 1; setTargetPage(p); loadTargets(p) }}>Siguiente</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
