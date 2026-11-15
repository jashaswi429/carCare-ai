import { useState } from 'react'
import { Alert, Button, Card, CardHeader, Field, Input } from '@/components/ui/Primitives'
import { formatNumber, formatRelative } from '@/lib/utils'

/**
 * Odometer updates are the single biggest lever on prediction accuracy, so the
 * dashboard keeps this action one tap away (PRD 4.4 / 4.11).
 */
export function OdometerCard({ vehicle, onUpdate }) {
  const [value, setValue] = useState(String(vehicle?.current_odometer ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaved(false)

    const next = Number(value)
    if (Number.isNaN(next) || next <= 0) {
      setError('Enter a valid odometer reading.')
      return
    }
    if (next < Number(vehicle.current_odometer)) {
      setError('The odometer cannot go backwards. Check the reading.')
      return
    }

    setSaving(true)
    try {
      await onUpdate(next)
      setSaved(true)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        icon="gauge"
        title="Update odometer"
        subtitle={`Last updated ${formatRelative(vehicle?.odometer_updated_at ?? vehicle?.created_at)}`}
      />
      <form onSubmit={submit} className="space-y-3 p-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {saved ? <Alert tone="success">Odometer updated - predictions recalculated.</Alert> : null}

        <Field
          label="Current reading (km)"
          htmlFor="odometer-update"
          hint={`Currently recorded at ${formatNumber(vehicle?.current_odometer)} km.`}
        >
          <Input
            id="odometer-update"
            type="number"
            min={vehicle?.current_odometer ?? 0}
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            invalid={Boolean(error)}
          />
        </Field>

        <Button type="submit" loading={saving} className="w-full">
          {saving ? 'Updating…' : 'Update & recalculate'}
        </Button>
      </form>
    </Card>
  )
}
