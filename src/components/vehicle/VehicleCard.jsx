import { Link } from 'react-router-dom'
import { Badge, Card } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { formatNumber, vehicleInitials, vehicleTitle } from '@/lib/utils'
import { summarizeTasks } from '@/services/maintenanceEngine'

const HEALTH_TONES = { 'Good standing': 'success', 'Monitor closely': 'warning', 'Attention needed': 'warning', 'Overdue items present': 'danger' }

export function VehicleCard({ vehicle, tasks = [], isActive = false, onSelect }) {
  const { health, overdue, dueSoon } = summarizeTasks(tasks, vehicle)

  return (
    <Card className={isActive ? 'ring-2 ring-brand-200' : undefined}>
      <div className="flex items-start gap-3 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ink-800 to-ink-700 text-sm font-semibold text-white">
          {vehicleInitials(vehicle)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-ink-900">{vehicleTitle(vehicle)}</h3>
            {isActive ? <Badge tone="brand">Active</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {[
              vehicle.manufacturing_year,
              vehicle.fuel_type,
              vehicle.transmission,
              vehicle.condition,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Badge tone={HEALTH_TONES[health.label] ?? 'neutral'}>{health.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] tracking-wide text-slate-400 uppercase">Odometer</p>
          <p className="text-sm font-medium text-ink-800">{formatNumber(vehicle.current_odometer)} km</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide text-slate-400 uppercase">Overdue</p>
          <p className="text-sm font-medium text-ink-800">{overdue.length}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide text-slate-400 uppercase">Due soon</p>
          <p className="text-sm font-medium text-ink-800">{dueSoon.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
        <Link
          to={`/vehicles/${vehicle.id}`}
          onClick={onSelect}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-sm font-medium text-ink-800 transition-colors hover:bg-slate-100"
        >
          Open vehicle
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
        {!isActive && onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="rounded-xl px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Set active
          </button>
        ) : null}
      </div>
    </Card>
  )
}
