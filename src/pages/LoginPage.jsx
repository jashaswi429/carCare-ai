import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, Button, Field, Input } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import { isDemoMode } from '@/data/backend'

export function LoginPage() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={location.state?.from ?? '/dashboard'} replace />

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }

    setSubmitting(true)
    try {
      await signIn({ email: form.email, password: form.password })
      navigate(location.state?.from ?? '/dashboard', { replace: true })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Pick up where you left off with your vehicle profile."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            invalid={Boolean(error)}
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={form.password}
              onChange={update('password')}
              className="pr-11"
              invalid={Boolean(error)}
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

        <div className="flex justify-end">
          <Link to="/reset-password" className="text-sm text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        {isDemoMode ? (
          <p className="text-center text-xs text-slate-500">
            Demo mode: create an account on the{' '}
            <Link to="/signup" className="font-medium text-brand-600">
              sign up
            </Link>{' '}
            screen - it works instantly and stays in this browser.
          </p>
        ) : null}
      </form>
    </AuthLayout>
  )
}
