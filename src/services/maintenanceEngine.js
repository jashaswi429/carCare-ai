/**
 * Predictive maintenance engine - PHASE 2 core calculation layer.
 *
 * What this engine is (and is not):
 * - It is a deterministic, transparent rule engine that combines the vehicle
 *   profile, manufacturer/industry intervals and known odometer readings.
 * - It is NOT a diagnostic system. It never claims a component has failed.
 *   Every output is traceable to `source`: manufacturer | rule_based | ai_suggested
 *   | confirmed_diagnostic (PRD 4.4).
 * - Whenever a figure is an assumption rather than a recorded fact, the task is
 *   flagged with `baseline_assumed` so the UI can say so out loud (PRD 12).
 */

import { addMonths, toISODate } from '@/lib/utils'
import { scheduleForVehicle } from '@/data/maintenanceCatalog'

export const TASK_STATUS = {
  OVERDUE: 'overdue',
  DUE_SOON: 'due_soon',
  OK: 'ok',
  UNKNOWN: 'unknown',
}

const DUE_SOON_KM = 1000
const DUE_SOON_DAYS = 30

export const SOURCE_LABELS = {
  manufacturer: 'Manufacturer schedule',
  rule_based: 'Rule-based estimate',
  ai_suggested: 'AI suggestion',
  confirmed_diagnostic: 'Confirmed diagnostic',
}

export const STATUS_LABELS = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  ok: 'On track',
  unknown: 'Needs data',
}

const daysBetween = (from, to) => Math.ceil((to.getTime() - from.getTime()) / 86_400_000)

/** Evaluate a single task against the vehicle's current odometer & today's date. */
export function evaluateTask(task, vehicle, today = new Date()) {
  const odometer = Number(vehicle?.current_odometer) || 0
  const kmRemaining =
    task.next_due_odometer === null || task.next_due_odometer === undefined
      ? null
      : Number(task.next_due_odometer) - odometer

  const daysRemaining = task.next_due_date ? daysBetween(today, new Date(task.next_due_date)) : null

  if (kmRemaining === null && daysRemaining === null) {
    return { status: TASK_STATUS.UNKNOWN, kmRemaining, daysRemaining }
  }

  const overdue =
    (kmRemaining !== null && kmRemaining <= 0) || (daysRemaining !== null && daysRemaining <= 0)

  const dueSoon =
    (kmRemaining !== null && kmRemaining <= DUE_SOON_KM) ||
    (daysRemaining !== null && daysRemaining <= DUE_SOON_DAYS)

  return {
    status: overdue ? TASK_STATUS.OVERDUE : dueSoon ? TASK_STATUS.DUE_SOON : TASK_STATUS.OK,
    kmRemaining,
    daysRemaining,
  }
}

/** Attach the freshly computed status + derived values to a task row. */
export function withStatus(task, vehicle, today = new Date()) {
  const { status, kmRemaining, daysRemaining } = evaluateTask(task, vehicle, today)
  return { ...task, status, kmRemaining, daysRemaining }
}

/** True when the schedule had to be projected because no past service is known. */
export function hasAssumedBaseline(vehicle) {
  return vehicle?.previous_service_odometer == null && !vehicle?.previous_service_date
}

/**
 * Build the full maintenance task set for a newly onboarded vehicle.
 * Returns rows shaped exactly like the `maintenance_tasks` table so the same
 * objects can be persisted by either backend.
 */
export function buildTaskRows(vehicle, today = new Date()) {
  const schedule = scheduleForVehicle({
    manufacturer: vehicle.manufacturer,
    fuelType: vehicle.fuel_type,
  })

  const assumed = hasAssumedBaseline(vehicle)
  const odometer = Number(vehicle.current_odometer) || 0

  // With no recorded history, the schedule is projected forward from the data
  // we actually have (today's date and today's odometer) instead of inventing
  // overdue items from the registration date.
  const baseOdometer = assumed ? odometer : Number(vehicle.previous_service_odometer) || odometer
  const baseDate = assumed ? new Date(today) : new Date(vehicle.previous_service_date)

  return schedule.map((template) => {
    const row = {
      task_key: template.key,
      task_name: template.name,
      recommended_interval_km: template.intervalKm ?? null,
      recommended_interval_months: template.intervalMonths ?? null,
      last_completed_date: assumed ? null : toISODate(baseDate),
      last_completed_odometer: assumed ? null : baseOdometer,
      next_due_odometer: template.intervalKm ? baseOdometer + template.intervalKm : null,
      next_due_date: template.intervalMonths ? toISODate(addMonths(baseDate, template.intervalMonths)) : null,
      estimated_cost_min: template.costMin ?? null,
      estimated_cost_max: template.costMax ?? null,
      source: template.source,
      notes: assumed
        ? 'Projected from your current odometer because no previous service was recorded. Add your last service to sharpen this estimate.'
        : `Based on ${SOURCE_LABELS[template.source].toLowerCase()}. ${template.why ?? ''}`.trim(),
    }
    const { status } = evaluateTask(row, vehicle, today)
    return { ...row, status }
  })
}

/** Fleet-level roll-up used by the dashboard header. */
export function summarizeTasks(tasks = [], vehicle, today = new Date()) {
  const evaluated = tasks.map((task) => withStatus(task, vehicle, today))
  const overdue = evaluated.filter((t) => t.status === TASK_STATUS.OVERDUE)
  const dueSoon = evaluated.filter((t) => t.status === TASK_STATUS.DUE_SOON)
  const ok = evaluated.filter((t) => t.status === TASK_STATUS.OK)

  const sortByUrgency = (a, b) => {
    const aValue = a.daysRemaining ?? Number.POSITIVE_INFINITY
    const bValue = b.daysRemaining ?? Number.POSITIVE_INFINITY
    if (aValue !== bValue) return aValue - bValue
    return (a.kmRemaining ?? Number.POSITIVE_INFINITY) - (b.kmRemaining ?? Number.POSITIVE_INFINITY)
  }

  const nextUp = [...overdue, ...dueSoon].sort(sortByUrgency)[0] ?? null

  const score = Math.max(0, Math.min(100, 100 - overdue.length * 20 - dueSoon.length * 6))
  const health =
    evaluated.length === 0
      ? { score: null, label: 'No schedule yet' }
      : score >= 85
        ? { score, label: 'Good standing' }
        : score >= 70
          ? { score, label: 'Monitor closely' }
          : score >= 50
            ? { score, label: 'Attention needed' }
            : { score, label: 'Overdue items present' }

  return { evaluated, overdue, dueSoon, ok, nextUp, health }
}

/**
 * Indicative cost forecast for everything falling due inside `horizonDays`.
 * Always surfaced as a range, never as a fixed price (PRD 4.10).
 */
export function forecastCost(tasks = [], vehicle, horizonDays = 90, today = new Date()) {
  const evaluated = tasks.map((task) => withStatus(task, vehicle, today))
  const upcoming = evaluated.filter((task) => {
    if (task.status === TASK_STATUS.OVERDUE) return true
    if (task.daysRemaining !== null) return task.daysRemaining <= horizonDays
    if (task.kmRemaining !== null) return task.kmRemaining <= 2000
    return false
  })

  const min = upcoming.reduce((sum, t) => sum + (Number(t.estimated_cost_min) || 0), 0)
  const max = upcoming.reduce((sum, t) => sum + (Number(t.estimated_cost_max) || 0), 0)

  return { min, max, count: upcoming.length, tasks: upcoming, horizonDays }
}

/**
 * Deterministic, explainable dashboard insights (rule_based).
 * Real AI-generated insights arrive in Phase 5 and will be labelled separately.
 */
export function buildInsights(vehicle, tasks = [], today = new Date()) {
  const summary = summarizeTasks(tasks, vehicle, today)
  const forecast = forecastCost(tasks, vehicle, 90, today)
  const insights = []

  if (summary.overdue.length > 0) {
    insights.push({
      tone: 'warning',
      title: `${summary.overdue.length} maintenance ${summary.overdue.length === 1 ? 'item is' : 'items are'} past the recommended point`,
      body: `Start with ${summary.overdue
        .slice(0, 2)
        .map((t) => t.task_name.toLowerCase())
        .join(' and ')}. These are overdue against your ${summary.overdue[0].recommended_interval_km ? 'distance' : 'time'} interval.`,
    })
  }

  if (summary.nextUp && summary.nextUp.status === TASK_STATUS.DUE_SOON) {
    insights.push({
      tone: 'info',
      title: `Next up: ${summary.nextUp.task_name}`,
      body: buildDueSentence(summary.nextUp),
    })
  }

  if (forecast.count > 0) {
    insights.push({
      tone: 'neutral',
      title: `About ${forecast.count} service ${forecast.count === 1 ? 'item' : 'items'} fall due in the next 90 days`,
      body: 'Estimated cost range shown on your dashboard is an indicative Indian market range, not a quotation.',
    })
  }

  if (hasAssumedBaseline(vehicle)) {
    insights.push({
      tone: 'neutral',
      title: 'Add your last service to sharpen every prediction',
      body: 'Right now the schedule is projected from your current odometer. One past service record typically moves the estimates by a full service cycle.',
    })
  }

  if (insights.length === 0 && summary.evaluated.length > 0) {
    insights.push({
      tone: 'success',
      title: 'No maintenance item needs attention right now',
      body: 'All tracked items are within their recommended intervals. Keep your odometer updated for accurate predictions.',
    })
  }

  return insights
}

export function buildDueSentence(task) {
  const parts = []
  if (task.kmRemaining !== null && task.kmRemaining !== undefined) {
    parts.push(
      task.kmRemaining <= 0
        ? `${Math.abs(task.kmRemaining).toLocaleString('en-IN')} km past due`
        : `in ${task.kmRemaining.toLocaleString('en-IN')} km`,
    )
  }
  if (task.daysRemaining !== null && task.daysRemaining !== undefined) {
    parts.push(
      task.daysRemaining <= 0
        ? `${Math.abs(task.daysRemaining)} days past due`
        : `about ${Math.round(task.daysRemaining / 30.44)} month(s) of time`,
    )
  }
  return parts.length ? `Due ${parts.join(' or ')} — whichever comes first.` : 'Interval not defined for this item.'
}
