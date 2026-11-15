/**
 * LOCAL DEMO BACKEND (development / review only).
 *
 * Used automatically when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent
 * so the product can be run end to end without provisioning a project.
 *
 * It mirrors the exact API and response shapes of `supabaseBackend`, so
 * swapping to Supabase requires no changes anywhere else in the app.
 *
 * Deliberate limitations (do NOT ship this to production):
 * - passwords are stored obfuscated, not hashed (browser-only storage)
 * - data lives in this browser profile only
 * - ownership checks are done in JS instead of by Row Level Security
 */

const KEYS = {
  users: 'acc.users',
  session: 'acc.session',
  vehicles: 'acc.vehicles',
  tasks: 'acc.tasks',
}

const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`

const now = () => new Date().toISOString()

const obfuscate = (value) => btoa(unescape(encodeURIComponent(value)))

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name,
  created_at: user.created_at,
})

const authListeners = new Set()
const emitAuthChange = (user) => authListeners.forEach((listener) => listener(user))

const requireUser = () => {
  const session = read(KEYS.session, null)
  if (!session) throw new Error('You need to sign in to continue.')
  const user = read(KEYS.users, []).find((candidate) => candidate.id === session.userId)
  if (!user) throw new Error('Your session has expired. Please sign in again.')
  return user
}

export const localBackend = {
  mode: 'local',

  auth: {
    async getCurrentUser() {
      try {
        return publicUser(requireUser())
      } catch {
        return null
      }
    },

    onAuthChange(callback) {
      authListeners.add(callback)
      return () => authListeners.delete(callback)
    },

    async signUp({ email, password, fullName }) {
      const users = read(KEYS.users, [])
      const normalised = email.trim().toLowerCase()
      if (users.some((user) => user.email === normalised)) {
        throw new Error('An account already exists with this email address.')
      }
      const user = {
        id: uid(),
        email: normalised,
        full_name: fullName?.trim() || '',
        password: obfuscate(password),
        created_at: now(),
      }
      write(KEYS.users, [...users, user])
      write(KEYS.session, { userId: user.id, createdAt: now() })
      const safe = publicUser(user)
      emitAuthChange(safe)
      return safe
    },

    async signIn({ email, password }) {
      const normalised = email.trim().toLowerCase()
      const user = read(KEYS.users, []).find((candidate) => candidate.email === normalised)
      if (!user || user.password !== obfuscate(password)) {
        throw new Error('Incorrect email or password.')
      }
      write(KEYS.session, { userId: user.id, createdAt: now() })
      const safe = publicUser(user)
      emitAuthChange(safe)
      return safe
    },

    async signOut() {
      window.localStorage.removeItem(KEYS.session)
      emitAuthChange(null)
    },

    async requestPasswordReset(email) {
      const exists = read(KEYS.users, []).some(
        (user) => user.email === email.trim().toLowerCase(),
      )
      if (!exists) throw new Error('No account found with this email address.')
      // A real reset link is only possible with a mail service. Demo mode
      // deliberately does not pretend an email was sent.
      return { delivered: false }
    },
  },

  db: {
    async listVehicles(userId) {
      return read(KEYS.vehicles, [])
        .filter((vehicle) => vehicle.user_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    },

    async getVehicle(vehicleId) {
      const user = requireUser()
      const vehicle = read(KEYS.vehicles, []).find((row) => row.id === vehicleId)
      if (!vehicle) throw new Error('Vehicle not found.')
      if (vehicle.user_id !== user.id) throw new Error('You do not have access to this vehicle.')
      return vehicle
    },

    async createVehicle({ vehicle, tasks = [] }) {
      const user = requireUser()
      const stored = { ...vehicle, id: uid(), user_id: user.id, created_at: now() }
      write(KEYS.vehicles, [...read(KEYS.vehicles, []), stored])

      const taskRows = tasks.map((task) => ({ ...task, id: uid(), vehicle_id: stored.id, created_at: now() }))
      write(KEYS.tasks, [...read(KEYS.tasks, []), ...taskRows])

      return { vehicle: stored, tasks: taskRows }
    },

    async updateVehicle(vehicleId, patch) {
      const vehicles = read(KEYS.vehicles, [])
      const index = vehicles.findIndex((row) => row.id === vehicleId)
      if (index === -1) throw new Error('Vehicle not found.')
      vehicles[index] = { ...vehicles[index], ...patch }
      write(KEYS.vehicles, vehicles)
      return vehicles[index]
    },

    async deleteVehicle(vehicleId) {
      write(
        KEYS.vehicles,
        read(KEYS.vehicles, []).filter((row) => row.id !== vehicleId),
      )
      write(
        KEYS.tasks,
        read(KEYS.tasks, []).filter((row) => row.vehicle_id !== vehicleId),
      )
    },

    async listMaintenanceTasks(vehicleId) {
      return read(KEYS.tasks, []).filter((row) => row.vehicle_id === vehicleId)
    },

    async updateMaintenanceTask(taskId, patch) {
      const tasks = read(KEYS.tasks, [])
      const index = tasks.findIndex((row) => row.id === taskId)
      if (index === -1) throw new Error('Maintenance task not found.')
      tasks[index] = { ...tasks[index], ...patch }
      write(KEYS.tasks, tasks)
      return tasks[index]
    },

    /** Persist recalculated statuses in one go (used after an odometer update). */
    async syncMaintenanceTaskStatuses(rows = []) {
      if (rows.length === 0) return []
      const tasks = read(KEYS.tasks, [])
      const byId = new Map(rows.map((row) => [row.id, row]))
      const next = tasks.map((task) => (byId.has(task.id) ? { ...task, ...byId.get(task.id) } : task))
      write(KEYS.tasks, next)
      return rows
    },
  },
}
