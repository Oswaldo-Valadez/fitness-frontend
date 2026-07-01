import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
        setErrors({ email: 'Credenciales incorrectas.' })
      }
    }
  }

  return (
    <AuthCard title="Iniciar sesión" subtitle="Bienvenido de vuelta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
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
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          required
        />
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-emerald-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" loading={status === 'loading'} className="w-full">
          Entrar
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-emerald-600 hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthCard>
  )
}
