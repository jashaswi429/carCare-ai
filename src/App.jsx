import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { VehiclesProvider } from '@/context/VehiclesContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { VehiclesPage } from '@/pages/VehiclesPage'
import { VehicleNewPage } from '@/pages/VehicleNewPage'
import { VehicleDetailPage } from '@/pages/VehicleDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import {
  AssistantPage,
  ExpensesPage,
  InvoicesPage,
  RemindersPage,
  ServiceHistoryPage,
} from '@/pages/PlannedPages'

/**
 * The authenticated application shell.
 * VehiclesProvider lives inside ProtectedRoute so it only ever loads data for a
 * signed-in user (PRD section 8 - users must only reach their own data).
 */
function ProtectedShell() {
  return (
    <ProtectedRoute>
      <VehiclesProvider>
        <AppLayout />
      </VehiclesProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/new" element={<VehicleNewPage />} />
          <Route path="/vehicles/:vehicleId" element={<VehicleDetailPage />} />
          <Route path="/service-history" element={<ServiceHistoryPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
