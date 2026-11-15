import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icons'
import { Badge, Button } from '@/components/ui/Primitives'
import { BrandMark } from '@/components/layout/Sidebar'
import { vehicleTitle } from '@/lib/utils'
import { isDemoMode } from '@/data/backend'
import { useAuth } from '@/context/AuthContext'
import { useVehicles } from '@/context/VehiclesContext'
import { APP_ROUTES } from '@/config/navigation'

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const initials = (user?.full_name || user?.email || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-800 text-xs font-semibold text-white">
          {initials}
        </span>
        <Icon name="chevronDown" className="h-4 w-4 text-slate-400" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-800">
              {user?.full_name || 'Car owner'}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Icon name="gear" className="h-4 w-4 text-slate-400" />
            Account settings
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false)
              await signOut()
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50"
          >
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Topbar({ onOpenMenu }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { vehicles, activeVehicle, selectVehicle } = useVehicles()
  const title = APP_ROUTES[location.pathname] ?? 'CarCare AI'

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Icon name="menu" />
        </button>

        <div className="lg:hidden">
          <BrandMark compact />
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <h2 className="truncate text-sm font-semibold text-ink-800">{title}</h2>
          <p className="truncate text-xs text-slate-500">
            {activeVehicle
              ? `${vehicleTitle(activeVehicle)} · ${activeVehicle.current_odometer?.toLocaleString('en-IN') ?? 0} km`
              : 'No vehicle added yet'}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isDemoMode ? (
            <Badge tone="warning" icon="info" className="hidden sm:inline-flex">
              Demo data
            </Badge>
          ) : null}

          {vehicles.length > 1 ? (
            <label className="hidden md:block">
              <span className="sr-only">Switch vehicle</span>
              <select
                value={activeVehicle?.id ?? ''}
                onChange={(event) => selectVehicle(event.target.value)}
                className="h-10 max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink-800 shadow-sm focus:border-brand-500 focus:outline-none"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicleTitle(vehicle)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            icon="plus"
            className="hidden sm:inline-flex"
            onClick={() => navigate('/vehicles/new')}
          >
            Add vehicle
          </Button>

          <UserMenu />
        </div>
      </div>

      {isDemoMode ? (
        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6">
          Running in <strong>local demo mode</strong> - accounts and vehicles are saved in this
          browser. See <code className="rounded bg-amber-100 px-1">.env.example</code> to connect
          Supabase.
        </div>
      ) : null}
    </header>
  )
}
