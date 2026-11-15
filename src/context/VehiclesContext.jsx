import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { db } from '@/data/backend'
import { useAuth } from '@/context/AuthContext'
import { buildTaskRows, evaluateTask } from '@/services/maintenanceEngine'

const VehiclesContext = createContext(null)

const ACTIVE_KEY = 'acc.activeVehicleId'

export function VehiclesProvider({ children }) {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [tasksByVehicle, setTasksByVehicle] = useState({})
  const [activeVehicleId, setActiveVehicleIdState] = useState(
    () => window.localStorage.getItem(ACTIVE_KEY) || null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const setActiveVehicleId = useCallback((vehicleId) => {
    setActiveVehicleIdState(vehicleId)
    if (vehicleId) window.localStorage.setItem(ACTIVE_KEY, vehicleId)
    else window.localStorage.removeItem(ACTIVE_KEY)
  }, [])

  /** Load vehicles + their maintenance tasks. Replaces all local state. */
  const refresh = useCallback(async () => {
    if (!user) {
      setVehicles([])
      setTasksByVehicle({})
      setLoading(false)
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const list = await db.listVehicles(user.id)
      const taskEntries = await Promise.all(
        list.map(async (vehicle) => [vehicle.id, await db.listMaintenanceTasks(vehicle.id)]),
      )
      const map = Object.fromEntries(taskEntries)

      setVehicles(list)
      setTasksByVehicle(map)

      const stillValid = list.some((vehicle) => vehicle.id === activeVehicleId)
      if (!stillValid) setActiveVehicleId(list[0]?.id ?? null)

      return list
    } catch (cause) {
      setError(cause.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user, activeVehicleId, setActiveVehicleId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  /**
   * Onboard a vehicle: persist the profile and the generated maintenance
   * schedule (Phase 2 calculation) in a single operation.
   */
  const addVehicle = useCallback(
    async (formValues) => {
      const payload = {
        user_id: user.id,
        manufacturer: formValues.manufacturer,
        model: formValues.model.trim(),
        variant: formValues.variant?.trim() || null,
        manufacturing_year: Number(formValues.manufacturing_year),
        fuel_type: formValues.fuel_type,
        transmission: formValues.transmission,
        registration_date: formValues.registration_date || null,
        current_odometer: Number(formValues.current_odometer) || 0,
        avg_daily_km: Number(formValues.avg_daily_km) || 40,
        previous_service_date: formValues.previous_service_date || null,
        previous_service_odometer: formValues.previous_service_odometer
          ? Number(formValues.previous_service_odometer)
          : null,
        condition: formValues.condition || null,
        condition_notes: formValues.condition_notes?.trim() || null,
        odometer_updated_at: new Date().toISOString(),
      }

      const tasks = buildTaskRows(payload)
      const created = await db.createVehicle({ vehicle: payload, tasks })

      setVehicles((current) => [created.vehicle, ...current])
      setTasksByVehicle((current) => ({ ...current, [created.vehicle.id]: created.tasks }))
      setActiveVehicleId(created.vehicle.id)

      return created.vehicle
    },
    [user, setActiveVehicleId],
  )

  const patchVehicle = useCallback(async (vehicleId, patch) => {
    const updated = await db.updateVehicle(vehicleId, patch)
    setVehicles((current) => current.map((v) => (v.id === vehicleId ? updated : v)))
    return updated
  }, [])

  /** Odometer updates are the main driver of prediction accuracy. */
  const updateOdometer = useCallback(
    async (vehicleId, odometer) => {
      const updated = await patchVehicle(vehicleId, {
        current_odometer: Number(odometer) || 0,
        odometer_updated_at: new Date().toISOString(),
      })

      const tasks = tasksByVehicle[vehicleId] ?? []
      const recalculated = tasks.map((task) => ({ ...task, status: evaluateTask(task, updated).status }))
      if (recalculated.length > 0) await db.syncMaintenanceTaskStatuses(recalculated)

      setTasksByVehicle((current) => ({ ...current, [vehicleId]: recalculated }))
      return updated
    },
    [patchVehicle, tasksByVehicle],
  )

  const removeVehicle = useCallback(
    async (vehicleId) => {
      await db.deleteVehicle(vehicleId)
      setVehicles((current) => current.filter((v) => v.id !== vehicleId))
      setTasksByVehicle((current) => {
        const next = { ...current }
        delete next[vehicleId]
        return next
      })
      if (activeVehicleId === vehicleId) {
        const remaining = vehicles.filter((v) => v.id !== vehicleId)
        setActiveVehicleId(remaining[0]?.id ?? null)
      }
    },
    [activeVehicleId, vehicles, setActiveVehicleId],
  )

  const value = useMemo(() => {
    const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) ?? vehicles[0] ?? null
    return {
      vehicles,
      activeVehicle,
      activeVehicleId: activeVehicle?.id ?? null,
      tasksByVehicle,
      activeTasks: activeVehicle ? (tasksByVehicle[activeVehicle.id] ?? []) : [],
      loading,
      error,
      refresh,
      addVehicle,
      patchVehicle,
      updateOdometer,
      removeVehicle,
      selectVehicle: setActiveVehicleId,
    }
  }, [
    vehicles,
    activeVehicleId,
    tasksByVehicle,
    loading,
    error,
    refresh,
    addVehicle,
    patchVehicle,
    updateOdometer,
    removeVehicle,
    setActiveVehicleId,
  ])

  return <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>
}

export function useVehicles() {
  const context = useContext(VehiclesContext)
  if (!context) throw new Error('useVehicles must be used inside <VehiclesProvider>.')
  return context
}
