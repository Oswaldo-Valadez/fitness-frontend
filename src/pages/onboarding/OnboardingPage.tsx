import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { fetchMe } from '@/store/authSlice'
import { onboardingApi } from '@/api/profile'
import ConsentsStep from './ConsentsStep'
import ProfileStep from './ProfileStep'

type Step = 'consents' | 'profile'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('consents')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleConsentsAccepted = () => setStep('profile')

  const handleProfileSaved = async () => {
    await dispatch(fetchMe())
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Indicador de pasos */}
      <div className="flex justify-center pt-10 gap-4">
        {(['consents', 'profile'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
              ${step === s ? 'bg-emerald-600 text-white' : i < ['consents', 'profile'].indexOf(step) ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
              {i + 1}
            </div>
            <span className="hidden sm:block text-sm text-gray-600">
              {s === 'consents' ? 'Consentimientos' : 'Tu perfil'}
            </span>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-xl px-4 pb-16">
        {step === 'consents' && (
          <ConsentsStep onAccepted={handleConsentsAccepted} api={onboardingApi} />
        )}
        {step === 'profile' && (
          <ProfileStep onSaved={handleProfileSaved} api={onboardingApi} />
        )}
      </div>
    </div>
  )
}
