import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/ui/Primitives'
import {
  FUEL_TYPES,
  MANUFACTURERS,
  MODELS_BY_BRAND,
  TRANSMISSIONS,
  VEHICLE_CONDITIONS,
  scheduleForVehicle,
} from '@/data/maintenanceCatalog'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 31 }, (_, index) => currentYear - index)

export const EMPTY_VEHICLE = {
  manufacturer: '',
  model: '',
  variant: '',
  manufacturing_year: String(currentYear),
  fuel_type: 'Petrol',
  transmission: 'Manual',
  registration_date: '',
  current_odometer: '',
  avg_daily_km: '40',
  previous_service_date: '',
  previous_service_odometer: '',
  condition: '',
  condition_notes: '',
}

function validate(form) {
  const errors = {}
  if (!form.manufacturer) errors.manufacturer = 'Select the manufacturer.'
  if (!form.model.trim()) errors.model = 'Enter the model name.'
  if (!form.manufacturing_year) errors.manufacturing_year = 'Select the manufacturing year.'

  const odometer = Number(form.current_odometer)
  if (form.current_odometer === '' || Number.isNaN(odometer) || odometer < 0) {
    errors.current_odometer = 'Enter the current odometer reading in kilometres.'
  }

  if (form.previous_service_odometer !== '') {
    const previous = Number(form.previous_service_odometer)
    if (Number.isNaN(previous) || previous < 0) {
      errors.previous_service_odometer = 'Enter a valid reading.'
    } else if (!Number.isNaN(odometer) && previous > odometer) {
      errors.previous_service_odometer = 'Last service reading cannot be higher than the current odometer.'
    }
  }

  const daily = Number(form.avg_daily_km)
  if (form.avg_daily_km === '' || Number.isNaN(daily) || daily <= 0) {
    errors.avg_daily_km = 'Enter your approximate daily driving distance.'
  }

  return errors
}

export function VehicleForm({ initialValues = EMPTY_VEHICLE, onSubmit, onCancel, submitLabel = 'Add vehicle' }) {
  const [form, setForm] = useState({ ...EMPTY_VEHICLE, ...initialValues })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [key]: value }))
  }

  // Live preview of what the predictive engine will track for this selection.
  const tracked = useMemo(
    () =>
      form.manufacturer
        ? scheduleForVehicle({ manufacturer: form.manufacturer, fuelType: form.fuel_type })
        : [],
    [form.manufacturer, form.fuel_type],
  )

  const modelSuggestions = MODELS_BY_BRAND[form.manufacturer] ?? []

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix the highlighted fields.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader
          icon="car"
          title="Vehicle identity"
          subtitle="These details decide which manufacturer maintenance schedule is applied."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Manufacturer" htmlFor="manufacturer" required error={errors.manufacturer}>
            <Select
              id="manufacturer"
              value={form.manufacturer}
              onChange={update('manufacturer')}
              invalid={Boolean(errors.manufacturer)}
            >
              <option value="">Select manufacturer</option>
              {MANUFACTURERS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Model"
            htmlFor="model"
            required
            error={errors.model}
            hint={modelSuggestions.length ? 'Suggestions appear as you type.' : undefined}
          >
            <Input
              id="model"
              list="model-options"
              placeholder="Swift"
              value={form.model}
              onChange={update('model')}
              invalid={Boolean(errors.model)}
            />
            <datalist id="model-options">
              {modelSuggestions.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </Field>

          <Field label="Variant" htmlFor="variant" hint="Optional - e.g. VXi, ZX, SX(O)">
            <Input id="variant" placeholder="VXi" value={form.variant} onChange={update('variant')} />
          </Field>

          <Field label="Manufacturing year" htmlFor="year" required error={errors.manufacturing_year}>
            <Select
              id="year"
              value={form.manufacturing_year}
              onChange={update('manufacturing_year')}
              invalid={Boolean(errors.manufacturing_year)}
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fuel type" htmlFor="fuel" required>
            <Select id="fuel" value={form.fuel_type} onChange={update('fuel_type')}>
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Transmission" htmlFor="transmission" required>
            <Select id="transmission" value={form.transmission} onChange={update('transmission')}>
              {TRANSMISSIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Registration date" htmlFor="registration" hint="Used to estimate vehicle age.">
            <Input
              id="registration"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.registration_date}
              onChange={update('registration_date')}
            />
          </Field>

          <Field label="Current condition" htmlFor="condition" hint="Your own assessment - helps set expectations.">
            <Select id="condition" value={form.condition} onChange={update('condition')}>
              <option value="">Not sure</option>
              {VEHICLE_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          icon="gauge"
          title="Odometer & driving"
          subtitle="Predictions are driven mostly by these two numbers."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Current odometer (km)" htmlFor="odometer" required error={errors.current_odometer}>
            <Input
              id="odometer"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="42000"
              value={form.current_odometer}
              onChange={update('current_odometer')}
              invalid={Boolean(errors.current_odometer)}
            />
          </Field>

          <Field
            label="Average driving per day (km)"
            htmlFor="daily"
            required
            error={errors.avg_daily_km}
            hint="Converts distance-based intervals into dates."
          >
            <Input
              id="daily"
              type="number"
              min="1"
              inputMode="numeric"
              value={form.avg_daily_km}
              onChange={update('avg_daily_km')}
              invalid={Boolean(errors.avg_daily_km)}
            />
          </Field>

          <Field
            label="Last service date"
            htmlFor="prevDate"
            hint="Leave blank if unknown - we'll project the schedule instead."
          >
            <Input
              id="prevDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.previous_service_date}
              onChange={update('previous_service_date')}
            />
          </Field>

          <Field
            label="Last service odometer (km)"
            htmlFor="prevOdo"
            error={errors.previous_service_odometer}
            hint="Improves the accuracy of every prediction."
          >
            <Input
              id="prevOdo"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="35000"
              value={form.previous_service_odometer}
              onChange={update('previous_service_odometer')}
              invalid={Boolean(errors.previous_service_odometer)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Anything you already know about the car?" htmlFor="notes">
              <Textarea
                id="notes"
                rows={3}
                placeholder="e.g. Bought used in 2024, slight vibration at idle, second owner."
                value={form.condition_notes}
                onChange={update('condition_notes')}
              />
            </Field>
          </div>
        </div>
      </Card>

      {tracked.length > 0 ? (
        <Alert tone="info" title={`${tracked.length} maintenance items will be tracked`}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tracked.map((task) => (
              <Badge key={task.key} tone={task.source === 'manufacturer' ? 'brand' : 'neutral'}>
                {task.name}
              </Badge>
            ))}
          </div>
          <p className="pt-2 text-xs">
            Manufacturer-based intervals are used where available; the rest are rule-based estimates.
            You can review and correct everything later.
          </p>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? 'Saving vehicle…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
