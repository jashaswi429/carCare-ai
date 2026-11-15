import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonRows } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { useVehicles } from '@/context/VehiclesContext'
import { VehicleCard } from '@/components/vehicle/VehicleCard'

export function VehiclesPage() {
  const { vehicles, tasksByVehicle, activeVehicleId, loading, selectVehicle } = useVehicles()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Garage"
        title="Your vehicles"
        description="Each vehicle keeps its own maintenance profile, schedule and cost estimates."
        actions={
          <Button as={Link} to="/vehicles/new" icon="plus">
            Add vehicle
          </Button>
        }
      />

      {loading ? (
        <SkeletonRows rows={2} />
      ) : vehicles.length === 0 ? (
        <Card>
          <EmptyState
            icon="car"
            title="No vehicles yet"
            description="Add your car to generate its maintenance schedule."
            action={
              <Button as={Link} to="/vehicles/new" icon="plus">
                Add your first vehicle
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              tasks={tasksByVehicle[vehicle.id] ?? []}
              isActive={vehicle.id === activeVehicleId}
              onSelect={() => selectVehicle(vehicle.id)}
            />
          ))}

          <Link
            to="/vehicles/new"
            className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Icon name="plus" className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink-800">Add another vehicle</span>
            <span className="text-xs text-slate-500">
              Multi-car support becomes unlimited on premium plans.
            </span>
          </Link>
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Badge tone="brand" icon="info">
          Phase 1 scope
        </Badge>
        <p className="text-xs text-slate-500">
          Vehicle onboarding, garage and the maintenance schedule are live. Service records, invoice
          reading and reminders follow in later phases.
        </p>
      </Card>
    </div>
  )
}
