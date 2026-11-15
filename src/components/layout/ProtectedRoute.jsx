import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Primitives'

/** Gate every authenticated screen. Also waits for the session to resolve. */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f7fb]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Spinner className="h-8 w-8 text-brand-600" />
          <p className="text-sm">Restoring your session…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
