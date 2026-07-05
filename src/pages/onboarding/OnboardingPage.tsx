import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Check, FileCheck, UserCog } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppDispatch } from '@/store/hooks'
import { fetchMe } from '@/store/authSlice'
import { onboardingApi } from '@/api/profile'
import ConsentsStep from './ConsentsStep'
import ProfileStep from './ProfileStep'

type Step = 'consents' | 'profile'

const STEPS: { key: Step; label: string; icon: typeof FileCheck }[] = [
  { key: 'consents', label: 'Consentimientos', icon: FileCheck },
  { key: 'profile', label: 'Tu perfil', icon: UserCog },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('consents')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleConsentsAccepted = () => setStep('profile')

  const handleProfileSaved = async () => {
    await dispatch(fetchMe())
    navigate('/dashboard', { replace: true })
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="min-h-dvh bg-linear-to-br from-primary/5 via-background to-accent/5">
      <div className="flex flex-col items-center pt-10">
        <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-elevated">
          <Activity className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="flex items-center gap-3">
          {STEPS.map(({ key, label, icon: Icon }, i) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors',
                    i < stepIndex && 'bg-accent text-white',
                    i === stepIndex && 'bg-primary text-on-primary',
                    i > stepIndex && 'bg-surface-muted text-muted',
                  )}
                >
                  {i < stepIndex ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={clsx('text-xs font-medium', i === stepIndex ? 'text-foreground' : 'text-muted')}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={clsx('h-0.5 w-10 rounded-full', i < stepIndex ? 'bg-accent' : 'bg-surface-muted')} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-xl px-4 pb-16">
        {step === 'consents' && <ConsentsStep onAccepted={handleConsentsAccepted} api={onboardingApi} />}
        {step === 'profile' && <ProfileStep onSaved={handleProfileSaved} api={onboardingApi} />}
      </div>
    </div>
  )
}
