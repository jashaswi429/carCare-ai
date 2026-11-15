import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Badge, Button, Card, CardHeader, DataRow, EmptyState, SkeletonRows, StatCard, Alert } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { formatDate, formatINR, formatNumber, vehicleTitle } from '@/lib/utils'
import { useVehicles } from '@/context/VehiclesContext'
import {
  TASK_STATUS,
  buildInsights,
  forecastCost,
  summarizeTasks,
} from '@/services/maintenanceEngine'
import { MaintenanceList } from '@/components/maintenance/MaintenanceTaskRow'
import { OdometerCard } from '@/components/vehicle/OdometerCard'

const UPCOMING_ORDER = {
  [TASK_STATUS.OVERDUE]: 0,
  [TASK_STATUS.DUE_SOON]: 1,
  [TASK_STATUS.OK]: 2,
  [TASK_STATUS.UNKNOWN]: 3,
}

const UPCOMING_PHASES = [
  { to: '/service-history', label: 'Service history', phase: 3, icon: 'wrench', body: 'Every past service in one chronological record.' },
  { to: '/invoices', label: 'Invoice reader', phase: 4, icon: 'invoice', body: 'Upload a bill and get it extracted automatically.' },
  { to: '/assistant', label: 'AI car assistant', phase: 5, icon: 'chat', body: 'Ask anything about your vehicle and its bills.' },
  { to: '/expenses', label: 'Expenses', phase: 7, icon: 'wallet', body: 'Trends, categories and forward cost estimates.' },
]

function InsightCard({ insight }) {
  const tones = {
    warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
    info: 'border-brand-200 bg-brand-50/70 text-brand-900',
    success: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    neutral: 'border-slate-200 bg-slate-50 text-ink-800',
  }
  const icons = { warning: 'alert', info: 'sparkle', success: 'check', neutral: 'info' }
  return (
    <div className={`rounded-xl border p-4 ${tones[insight.tone] ?? tones.neutral}`}>
      <div className="flex items-start gap-3">
        <Icon name={icons[insight.tone] ?? 'info'} className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{insight.title}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{insight.body}</p>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { vehicles, activeVehicle, activeTasks, loading, updateOdometer } = useVehicles()

  const derived = useMemo(() => {
    if (!activeVehicle) return null
    const summary = summarizeTasks(activeTasks, activeVehicle)
    const forecast = forecastCost(activeTasks, activeVehicle, 90)
    const insights = buildInsights(activeVehicle, activeTasks)
    const upcoming = [...summary.evaluated].sort((a, b) => {
      const order = (UPCOMING_ORDER[a.status] ?? 9) - (UPCOMING_ORDER[b.status] ?? 9)
      if (order !== 0) return order
      return (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999)
    })
    return { summary, forecast, insights, upcoming }
  }, [activeVehicle, activeTasks])

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonRows rows={2} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <SkeletonRows rows={4} />
      </div>
    )
  }

  if (!activeVehicle) {
    return (
      <>
        <PageHeader
          eyebrow="Vehicle dashboard"
          title="Your garage is empty"
          description="Add your first car to unlock maintenance tracking, predictions and cost estimates."
        />
        <Card className="mt-6">
          <EmptyState
            icon="car"
            title="No vehicle in your garage yet"
            description="Onboarding takes about a minute: identity, odometer and your last known service. We'll generate the maintenance schedule for your exact make and model."
            action={
              <Button as={Link} to="/vehicles/new" icon="plus" size="lg">
                Add your vehicle
              </Button>
            }
          />
        </Card>
      </>
    )
  }

  const { summary, forecast, insights, upcoming } = derived
  const needsAction = summary.overdue.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vehicle dashboard"
        title={vehicleTitle(activeVehicle)}
        description={[
          activeVehicle.manufacturing_year,
          activeVehicle.fuel_type,
          activeVehicle.transmission,
          activeVehicle.registration_date ? `Registered ${formatDate(activeVehicle.registration_date)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <>
            <Button as={Link} to={`/vehicles/${activeVehicle.id}`} variant="secondary" icon="car">
              Vehicle profile
            </Button>
            <Button as={Link} to="/vehicles/new" icon="plus">
              Add vehicle
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Odometer"
          value={formatNumber(activeVehicle.current_odometer)}
          unit="km"
          icon="gauge"
          hint={`Updated ${formatDate(activeVehicle.odometer_updated_at ?? activeVehicle.created_at)}`}
        />
        <StatCard
          label="Maintenance health"
          value={summary.health.score ?? '—'}
          unit={summary.health.score != null ? '/100' : ''}
          icon="shield"
          tone={needsAction ? 'danger' : summary.dueSoon.length > 0 ? 'warning' : 'success'}
          hint={summary.health.label}
        />
        <StatCard
          label="Overdue items"
          value={summary.overdue.length}
          icon="alert"
          tone={needsAction ? 'danger' : 'success'}
          hint={`${summary.dueSoon.length} more due soon`}
        />
        <StatCard
          label="Next 90 days (est.)"
          value={forecast.count === 0 ? '—' : `${formatINR(forecast.min, { compact: true })} - ${formatINR(forecast.max, { compact: true })}`}
          icon="wallet"
          tone="brand"
          hint={forecast.count === 0 ? 'Nothing due in this window' : `Across ${forecast.count} service items`}
        />
      </section>

      {needsAction ? (
        <Alert tone="warning" title={`${summary.overdue.length} item(s) are past the recommended interval`}>
          Overdue items are measured against distance and time intervals — not confirmed faults. Book a
          service to bring the schedule back on track.
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              icon="sparkle"
              title="Maintenance insights"
              subtitle="Rule-based analysis of your vehicle data"
              action={<Badge tone="neutral">Rule-based · AI arrives in Phase 5</Badge>}
            />
            <div className="space-y-3 p-5 pt-4">
              {insights.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Add a service record or update your odometer to generate insights.
                </p>
              ) : (
                insights.map((insight) => <InsightCard key={insight.title} insight={insight} />)
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              icon="clock"
              title="Upcoming maintenance"
              subtitle="Ordered by urgency - whichever limit (distance or time) comes first"
              action={
                <Link to="/reminders" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  View reminders
                </Link>
              }
            />
            <div className="mt-2">
              {upcoming.length === 0 ? (
                <EmptyState
                  icon="wrench"
                  title="No maintenance schedule yet"
                  description="We couldn't load the schedule for this vehicle."
                />
              ) : (
                <MaintenanceList tasks={upcoming.slice(0, 5)} />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              icon="wrench"
              title="Full maintenance schedule"
              subtitle={`${summary.evaluated.length} tracked items for this vehicle`}
            />
            <div className="mt-2">
              <MaintenanceList tasks={summary.evaluated} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <OdometerCard vehicle={activeVehicle} onUpdate={(odometer) => updateOdometer(activeVehicle.id, odometer)} />

          <Card>
            <CardHeader icon="car" title="Vehicle profile" />
            <div className="px-5 py-3">
              <DataRow label="Manufacturer" value={activeVehicle.manufacturer} />
              <DataRow label="Model / variant" value={[activeVehicle.model, activeVehicle.variant].filter(Boolean).join(' ')} />
              <DataRow label="Manufacturing year" value={activeVehicle.manufacturing_year} />
              <DataRow label="Fuel type" value={activeVehicle.fuel_type} />
              <DataRow label="Transmission" value={activeVehicle.transmission} />
              <DataRow label="Condition" value={activeVehicle.condition || 'Not recorded'} />
              <DataRow
                label="Last recorded service"
                value={activeVehicle.previous_service_date ? formatDate(activeVehicle.previous_service_date) : 'Unknown'}
              />
            </div>
            {activeVehicle.condition_notes ? (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                “{activeVehicle.condition_notes}”
              </p>
            ) : null}
          </Card>

          {vehicles.length > 1 ? (
            <Card>
              <CardHeader icon="dashboard" title="Your garage" subtitle={`${vehicles.length} vehicles`} />
              <div className="space-y-2 p-5 pt-3">
                {vehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    to={`/vehicles/${vehicle.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="truncate font-medium text-ink-800">{vehicleTitle(vehicle)}</span>
                    <span className="text-xs text-slate-500">{formatNumber(vehicle.current_odometer)} km</span>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Coming next in your roadmap</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {UPCOMING_PHASES.map((item) => (
            <Card key={item.to} className="p-4">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <Badge tone="neutral">Phase {item.phase}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-800">{item.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.body}</p>
              <Link
                to={item.to}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                See plan
                <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
