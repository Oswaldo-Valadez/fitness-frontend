import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import AuthCard from '@/components/ui/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: searchParams.get('email') ?? '',
    password: '',
    password_confirmation: '',
    token: searchParams.get('token') ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await authApi.resetPassword(form)
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const data = (err as { data?: { errors?: Record<string, string[]> } })?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) flat[k] = v[0]
        setErrors(flat)
      } else {
        setErrors({ password: 'El enlace expiró o es inválido.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Nueva contraseña">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" label="Correo electrónico" type="email"
          value={form.email} onChange={set('email')} error={errors.email} required />
        <Input id="password" label="Nueva contraseña" type="password" autoComplete="new-password"
          value={form.password} onChange={set('password')} error={errors.password} required />
        <Input id="password_confirmation" label="Confirmar contraseña" type="password" autoComplete="new-password"
          value={form.password_confirmation} onChange={set('password_confirmation')}
          error={errors.password_confirmation} required />
        <Button type="submit" loading={loading} className="w-full">
          Guardar contraseña
        </Button>
      </form>
      <Link to="/login" className="block text-center text-sm text-emerald-600 hover:underline">
        Volver al inicio de sesión
      </Link>
    </AuthCard>
  )
}
