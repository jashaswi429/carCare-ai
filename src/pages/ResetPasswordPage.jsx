import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, Button, Field, Input } from '@/components/ui/Primitives'
import { useAuth } from '@/context/AuthContext'

export function ResetPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const result = await requestPasswordReset(email)
      setStatus(result)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure link to choose a new password."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      }
    >
      {status ? (
        <div className="space-y-4">
          <Alert tone={status.delivered ? 'success' : 'info'} title={status.delivered ? 'Check your inbox' : 'Demo mode'}>
            {status.delivered
              ? `A reset link has been sent to ${email}. The link expires in one hour.`
              : 'Email delivery is not available in local demo mode. Configure Supabase authentication to send real reset links.'}
          </Alert>
          <Button as={Link} to="/login" variant="secondary" size="lg" className="w-full">
            Return to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Field label="Email address" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              invalid={Boolean(error)}
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            {submitting ? 'Sending link…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
