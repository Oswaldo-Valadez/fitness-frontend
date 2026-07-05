import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAppDispatch, useAuth } from '@/store/hooks'
import { login } from '@/store/authSlice'
import AuthCard from '@/components/ui/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const { status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      await dispatch(login(form)).unwrap()
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const data = (err as { data?: { errors?: Record<string, string[]> } })?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) flat[k] = v[0]
        setErrors(flat)
      } else {
        setErrors({ password: 'Credenciales incorrectas.' })
      }
    }
  }

  return (
    <AuthCard title="Iniciar sesión" subtitle="Bienvenido de vuelta a FitTrack">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          iconLeft={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          required
        />
        <Input
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          iconLeft={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          required
        />
        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" loading={status === 'loading'} className="w-full" size="lg">
          Entrar
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthCard>
  )
}
