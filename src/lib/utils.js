/** Small shared helpers. No side effects, no dependencies. */

/** Join class names, skipping falsy values. */
export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

/** ₹1,23,456 - Indian digit grouping. */
export function formatINR(amount, { compact = false } = {}) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value)
}

/** 1,23,456 km */
export function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN').format(n)
}

/** 15 Nov 2026 */
export function formatDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** 3 days ago / in 2 months */
export function formatRelative(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days < 0) {
    const n = Math.abs(days)
    return n < 45 ? `${n} days ago` : `${Math.round(n / 30)} months ago`
  }
  return days < 45 ? `in ${days} days` : `in ${Math.round(days / 30)} months`
}

/** ISO yyyy-mm-dd for <input type="date"> */
export function toISODate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function addMonths(date, months) {
  const next = new Date(date)
  const day = next.getDate()
  next.setMonth(next.getMonth() + months)
  if (next.getDate() < day) next.setDate(0) // clamp to end of month
  return next
}

/** "2019 Maruti Suzuki Swift VXi" */
export function vehicleTitle(vehicle) {
  if (!vehicle) return 'Vehicle'
  return [vehicle.manufacturer, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(' ')
}

export function vehicleInitials(vehicle) {
  if (!vehicle) return 'V'
  const source = `${vehicle.manufacturer ?? ''} ${vehicle.model ?? ''}`.trim()
  if (!source) return 'V'
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
