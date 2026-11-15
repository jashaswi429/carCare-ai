import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icons'

/* ------------------------------------------------------------------ Button */

const BUTTON_VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'bg-white text-ink-800 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink-900',
  danger: 'bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50',
  dark: 'bg-ink-800 text-white hover:bg-ink-900',
}

const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className,
  children,
  ...rest
}) {
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-70',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      disabled={Component === 'button' ? rest.disabled || loading : undefined}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} className="h-4 w-4" /> : null}
    </Component>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------- Forms */

export function Field({ label, hint, error, required, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink-800">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

const CONTROL_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-slate-400 shadow-sm transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-slate-50'

export function Input({ className, invalid, ...rest }) {
  return <input className={cn(CONTROL_CLASS, invalid && 'border-rose-300', className)} {...rest} />
}

export function Select({ className, invalid, children, ...rest }) {
  return (
    <select className={cn(CONTROL_CLASS, 'pr-9', invalid && 'border-rose-300', className)} {...rest}>
      {children}
    </select>
  )
}

export function Textarea({ className, rows = 3, ...rest }) {
  return <textarea rows={rows} className={cn(CONTROL_CLASS, 'resize-y', className)} {...rest} />
}

/* --------------------------------------------------------------- Feedback */

export function Alert({ tone = 'info', title, children, className }) {
  const tones = {
    info: 'bg-brand-50 text-brand-900 ring-brand-100',
    warning: 'bg-amber-50 text-amber-900 ring-amber-100',
    danger: 'bg-rose-50 text-rose-900 ring-rose-100',
    success: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  }
  const icons = { info: 'info', warning: 'alert', danger: 'alert', success: 'check' }
  return (
    <div className={cn('flex gap-3 rounded-xl p-3.5 text-sm ring-1', tones[tone], className)}>
      <Icon name={icons[tone]} className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-relaxed opacity-90">{children}</div> : null}
      </div>
    </div>
  )
}

export function Badge({ tone = 'neutral', children, className, icon }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    dark: 'bg-ink-800/90 text-white',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ Layout */

export function Card({ className, as: Component = 'div', children, ...rest }) {
  return (
    <Component
      className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm', className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ title, subtitle, action, icon, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-semibold text-ink-800">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-wider text-brand-600 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-slate-500">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function StatCard({ label, value, unit, hint, icon, tone = 'brand', className }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    neutral: 'bg-slate-100 text-slate-600',
  }
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
        {icon ? (
          <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tones[tone])}>
            <Icon name={icon} className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink-900">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  )
}

export function ProgressBar({ value, tone = 'brand', className }) {
  const tones = {
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  }
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full transition-all', tones[tone])} style={{ width: `${safe}%` }} />
    </div>
  )
}

export function EmptyState({ icon = 'sparkle', title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-ink-800">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function SkeletonRows({ rows = 3, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

export function DataRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {icon ? <Icon name={icon} className="h-4 w-4 text-slate-400" /> : null}
        {label}
      </span>
      <span className="text-sm font-medium text-ink-800">{value}</span>
    </div>
  )
}
