import { NavLink } from 'react-router-dom'
import { NAV_SECTIONS } from '@/config/navigation'
import { Icon } from '@/components/ui/Icons'
import { cn, vehicleTitle } from '@/lib/utils'
import { isDemoMode } from '@/data/backend'

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-white ring-1 ring-white/15'
            : 'text-slate-300/90 hover:bg-white/5 hover:text-white',
        )
      }
    >
      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.phase ? (
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 uppercase">
          P{item.phase}
        </span>
      ) : null}
    </NavLink>
  )
}

export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-900/30">
        <Icon name="car" className="h-5 w-5" />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">CarCare AI</span>
          <span className="block text-[11px] text-slate-400">Predictive maintenance</span>
        </span>
      )}
    </div>
  )
}

export function SidebarContent({ onNavigate, activeVehicle }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5">
      <div className="px-1">
        <BrandMark />
      </div>

      {activeVehicle ? (
        <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Active vehicle
          </p>
          <p className="mt-1 truncate text-sm font-medium text-white">{vehicleTitle(activeVehicle)}</p>
          <p className="text-xs text-slate-400">
            {activeVehicle.current_odometer?.toLocaleString('en-IN') ?? 0} km on odometer
          </p>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="space-y-1.5">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavItem key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className="rounded-xl bg-white/5 p-3 text-[11px] leading-relaxed text-slate-400 ring-1 ring-white/10">
        {isDemoMode ? (
          <>
            <span className="font-semibold text-slate-200">Local demo mode.</span> Data is stored in
            this browser only. Add Supabase keys to switch to the live backend.
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-200">Connected to Supabase.</span> Your data is
            private and protected by row level security.
          </>
        )}
      </div>
    </div>
  )
}

export function Sidebar(props) {
  return (
    <aside className="hidden w-72 shrink-0 bg-ink-900 lg:block">
      <div className="sticky top-0 h-screen">
        <SidebarContent {...props} />
      </div>
    </aside>
  )
}
