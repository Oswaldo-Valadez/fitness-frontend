import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import { useAppDispatch, useAuth } from '@/store/hooks'
import { register } from '@/store/authSlice'
import AuthCard from '@/components/ui/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const { status } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      await dispatch(register(form)).unwrap()
      navigate('/onboarding', { replace: true })
    } catch (err: unknown) {
      const data = (err as { data?: { errors?: Record<string, string[]> } })?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) flat[k] = v[0]
        setErrors(flat)
      }
    }
  }

  return (
    <AuthCard title="Crear cuenta" subtitle="Empieza a cuidar tu nutrición">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="name"
          label="Nombre completo"
          type="text"
          autoComplete="name"
          iconLeft={<User className="h-4 w-4" />}
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          required
        />
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          iconLeft={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <Input
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          iconLeft={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <Input
          id="password_confirmation"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          iconLeft={<Lock className="h-4 w-4" />}
          value={form.password_confirmation}
          onChange={set('password_confirmation')}
          error={errors.password_confirmation}
          required
        />
        <Button type="submit" loading={status === 'loading'} className="w-full" size="lg">
          Registrarme
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  )
}
