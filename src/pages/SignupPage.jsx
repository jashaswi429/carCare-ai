import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, Button, Field, Input } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'

const INITIAL = { fullName: '', email: '', password: '', confirm: '' }

export function SignupPage() {
  const { signUp, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Tell us your name so we can personalise your dashboard.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await signUp({ fullName: form.fullName, email: form.email, password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to start: one vehicle, full maintenance tracking."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Field label="Full name" htmlFor="fullName" required error={errors.fullName}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Rahul Sharma"
            value={form.fullName}
            onChange={update('fullName')}
            invalid={Boolean(errors.fullName)}
          />
        </Field>

        <Field label="Email address" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          error={errors.password}
          hint={errors.password ? undefined : 'Minimum 8 characters.'}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={update('password')}
              className="pr-11"
              invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4 w-4" />
            </button>
          </div>
        </Field>

        <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm}>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={update('confirm')}
            invalid={Boolean(errors.confirm)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          We only store what the maintenance engine needs: your account and your vehicle data. No
          location tracking, no driving surveillance.
        </p>
      </form>
    </AuthLayout>
  )
}
