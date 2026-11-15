import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  DataRow,
  EmptyState,
  PageHeader,
  SkeletonRows,
  StatCard,
} from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { formatDate, formatINR, formatNumber, vehicleTitle } from '@/lib/utils'
import { useVehicles } from '@/context/VehiclesContext'
import { forecastCost, summarizeTasks } from '@/services/maintenanceEngine'
import { MaintenanceList } from '@/components/maintenance/MaintenanceTaskRow'
import { OdometerCard } from '@/components/vehicle/OdometerCard'

export function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const { vehicles, tasksByVehicle, loading, activeVehicleId, selectVehicle, updateOdometer, removeVehicle } =
    useVehicles()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const vehicle = vehicles.find((item) => item.id === vehicleId)
  const tasks = tasksByVehicle[vehicleId] ?? []

  const derived = useMemo(() => {
    if (!vehicle) return null
    return {
      summary: summarizeTasks(tasks, vehicle),
      forecast: forecastCost(tasks, vehicle, 90),
    }
  }, [vehicle, tasks])

  const handleDelete = async () => {
    setError('')
    const confirmed = window.confirm(
      `Delete ${vehicleTitle(vehicle)} and its maintenance schedule? This cannot be undone.`,
    )
    if (!confirmed) return

    setBusy(true)
    try {
      await removeVehicle(vehicle.id)
      navigate('/vehicles', { replace: true })
    } catch (cause) {
      setError(cause.message)
      setBusy(false)
    }
  }

  if (loading) return <SkeletonRows rows={4} />

  if (!vehicle) {
    return (
      <Card>
        <EmptyState
          icon="alert"
          title="Vehicle not found"
          description="This vehicle may have been removed, or the link is incorrect."
          action={
            <Button as={Link} to="/vehicles" variant="secondary" icon="car">
              Back to garage
            </Button>
          }
        />
      </Card>
    )
  }

  const { summary, forecast } = derived
  const isActive = vehicle.id === activeVehicleId

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vehicle profile"
        title={vehicleTitle(vehicle)}
        description={[
          vehicle.manufacturing_year,
          vehicle.fuel_type,
          vehicle.transmission,
          vehicle.registration_date ? `Registered ${formatDate(vehicle.registration_date)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <>
            <Button as={Link} to="/dashboard" variant="secondary" icon="dashboard">
              Go to dashboard
            </Button>
            {!isActive ? (
              <Button variant="dark" onClick={() => selectVehicle(vehicle.id)}>
                Set as active
              </Button>
            ) : (
              <Badge tone="brand">Active vehicle</Badge>
            )}
          </>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Odometer" value={formatNumber(vehicle.current_odometer)} unit="km" icon="gauge" />
        <StatCard
          label="Health score"
          value={summary.health.score ?? '—'}
          unit="/100"
          icon="shield"
          tone={summary.overdue.length ? 'danger' : 'success'}
          hint={summary.health.label}
        />
        <StatCard label="Overdue" value={summary.overdue.length} icon="alert" tone={summary.overdue.length ? 'danger' : 'success'} />
        <StatCard
          label="Next 90 days (est.)"
          value={forecast.count ? `${formatINR(forecast.min, { compact: true })} - ${formatINR(forecast.max, { compact: true })}` : '—'}
          icon="wallet"
          hint={forecast.count ? `${forecast.count} service items` : 'Nothing due'}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              icon="wrench"
              title="Maintenance schedule"
              subtitle="Manufacturer intervals where available, otherwise rule-based estimates"
            />
            <div className="mt-2">
              <MaintenanceList tasks={summary.evaluated} />
            </div>
          </Card>

          <Card>
            <CardHeader
              icon="invoice"
              title="Service history"
              subtitle="Chronological records of every workshop visit"
              action={<Badge tone="neutral">Phase 3</Badge>}
            />
            <EmptyState
              icon="wrench"
              title="Service records arrive in Phase 3"
              description="You'll be able to add visits manually or let the AI invoice reader create them for you."
              action={
                <Button as={Link} to="/service-history" variant="secondary" size="sm">
                  See what's planned
                </Button>
              }
            />
          </Card>
        </div>

        <div className="space-y-6">
          <OdometerCard vehicle={vehicle} onUpdate={(value) => updateOdometer(vehicle.id, value)} />

          <Card>
            <CardHeader icon="car" title="Saved details" />
            <div className="px-5 py-3">
              <DataRow label="Manufacturer" value={vehicle.manufacturer} icon="shield" />
              <DataRow label="Model" value={vehicle.model} />
              <DataRow label="Variant" value={vehicle.variant || 'Not specified'} />
              <DataRow label="Manufacturing year" value={vehicle.manufacturing_year} />
              <DataRow label="Fuel type" value={vehicle.fuel_type} icon="fuel" />
              <DataRow label="Transmission" value={vehicle.transmission} />
              <DataRow label="Average use" value={`${vehicle.avg_daily_km ?? 40} km/day`} icon="road" />
              <DataRow
                label="Last known service"
                value={vehicle.previous_service_date ? formatDate(vehicle.previous_service_date) : 'Not recorded'}
              />
              <DataRow label="Condition" value={vehicle.condition || 'Not recorded'} />
              <DataRow label="Added on" value={formatDate(vehicle.created_at)} icon="clock" />
            </div>
            {vehicle.condition_notes ? (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                “{vehicle.condition_notes}”
              </p>
            ) : null}
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <Icon name="trash" className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink-800">Remove vehicle</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Deletes the vehicle and its maintenance schedule. Service records added later are
                  deleted with it.
                </p>
                <Button variant="danger" size="sm" className="mt-3" loading={busy} onClick={handleDelete}>
                  Delete vehicle
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
