import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { useVehicles } from '@/context/VehiclesContext'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { activeVehicle } = useVehicles()

  // Close the mobile drawer and reset scroll on navigation.
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  // Prevent background scrolling while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen bg-[#f6f7fb]">
      <Sidebar activeVehicle={activeVehicle} />

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] bg-ink-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-3 grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
              aria-label="Close navigation"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
            <SidebarContent activeVehicle={activeVehicle} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200/80 px-4 py-5 text-xs text-slate-500 sm:px-6">
          CarCare AI · Phase 1 foundation · Predictions are estimates, not confirmed diagnostics.
        </footer>
      </div>
    </div>
  )
}
