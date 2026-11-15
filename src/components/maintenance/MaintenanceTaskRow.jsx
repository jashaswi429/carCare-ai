import { Badge, Card, ProgressBar } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { cn, formatINR, formatNumber } from '@/lib/utils'
import { SOURCE_LABELS, STATUS_LABELS, TASK_STATUS, buildDueSentence } from '@/services/maintenanceEngine'

export function SourceBadge({ source }) {
  const tones = { manufacturer: 'brand', rule_based: 'neutral', ai_suggested: 'warning', confirmed_diagnostic: 'success' }
  return (
    <Badge tone={tones[source] ?? 'neutral'} icon={source === 'manufacturer' ? 'shield' : 'info'}>
      {SOURCE_LABELS[source] ?? source}
    </Badge>
  )
}

export function StatusBadge({ status }) {
  const tones = {
    [TASK_STATUS.OVERDUE]: 'danger',
    [TASK_STATUS.DUE_SOON]: 'warning',
    [TASK_STATUS.OK]: 'success',
    [TASK_STATUS.UNKNOWN]: 'neutral',
  }
  return <Badge tone={tones[status] ?? 'neutral'}>{STATUS_LABELS[status] ?? status}</Badge>
}

/** How far through the current interval this task is (0-100). */
function progressFor(task) {
  if (task.recommended_interval_km && task.kmRemaining !== null && task.kmRemaining !== undefined) {
    const done = task.recommended_interval_km - task.kmRemaining
    return (done / task.recommended_interval_km) * 100
  }
  if (task.recommended_interval_months && task.daysRemaining !== null && task.daysRemaining !== undefined) {
    const totalDays = task.recommended_interval_months * 30.44
    return ((totalDays - task.daysRemaining) / totalDays) * 100
  }
  return 0
}

export function MaintenanceTaskRow({ task, className }) {
  const tone =
    task.status === TASK_STATUS.OVERDUE
      ? 'danger'
      : task.status === TASK_STATUS.DUE_SOON
        ? 'warning'
        : 'success'

  const interval =
    [
      task.recommended_interval_km ? `every ${formatNumber(task.recommended_interval_km)} km` : null,
      task.recommended_interval_months ? `${task.recommended_interval_months} months` : null,
    ]
      .filter(Boolean)
      .join(' / ') || 'inspection based'

  const cost =
    task.estimated_cost_min != null
      ? `${formatINR(task.estimated_cost_min)}-${formatINR(task.estimated_cost_max)}`
      : null

  return (
    <div className={cn('border-b border-slate-100 px-5 py-4 last:border-0', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-800">{task.task_name}</h3>
            <StatusBadge status={task.status} />
          </div>
          <div className="mt-1.5">
            <SourceBadge source={task.source} />
          </div>
        </div>

        <div className="text-right">
          {cost ? (
            <p className="text-sm font-medium text-ink-800">{cost}</p>
          ) : null}
          <p className="text-xs text-slate-500">Indicative range</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600">{buildDueSentence(task)}</p>

      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={progressFor(task)} tone={tone} className="h-1.5 flex-1" />
        <span className="shrink-0 text-[11px] font-medium text-slate-400">{interval}</span>
      </div>

      {task.next_due_odometer ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Icon name="road" className="h-3.5 w-3.5" />
          Due at {formatNumber(task.next_due_odometer)} km
          {task.next_due_date ? ` or ${new Date(task.next_due_date).toLocaleDateString('en-IN')}` : ''}
        </p>
      ) : null}
    </div>
  )
}

export function MaintenanceList({ tasks = [], className }) {
  if (tasks.length === 0) return null
  return (
    <Card className={cn('overflow-hidden', className)}>
      {tasks.map((task) => (
        <MaintenanceTaskRow key={task.id ?? task.task_key} task={task} />
      ))}
    </Card>
  )
}
