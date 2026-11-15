import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icons'

const HIGHLIGHTS = [
  {
    icon: 'gauge',
    title: 'Predictive maintenance',
    body: 'Know what your car needs next, based on distance, time and your own service history.',
  },
  {
    icon: 'invoice',
    title: 'AI invoice reading',
    body: 'Upload a service bill and get every line explained in plain language.',
  },
  {
    icon: 'wallet',
    title: 'Expense forecasting',
    body: 'See an indicative cost range for the work coming up, instead of surprises.',
  },
]

/** Split-screen shell shared by sign in / sign up / password reset. */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-10 lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
            <Icon name="car" className="h-6 w-6" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-semibold text-white">CarCare AI</span>
            <span className="block text-xs text-slate-400">AI Predictive Car Care Platform</span>
          </span>
        </Link>

        <div className="relative max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Your car&apos;s maintenance, finally under control.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              One profile per vehicle: service history, upcoming work, cost estimates and an
              assistant that explains it all without jargon.
            </p>
          </div>

          <ul className="space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-accent-400">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{item.title}</span>
                  <span className="block text-xs leading-relaxed text-slate-400">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative max-w-md text-[11px] leading-relaxed text-slate-500">
          Estimates are guidance only. CarCare AI never claims a mechanical failure without validated
          data or an authorised workshop inspection.
        </p>
      </div>

      <div className="flex flex-col justify-center bg-white px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Icon name="car" className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-ink-800">CarCare AI</span>
          </Link>

          <header className="mb-6 space-y-1">
            <h2 className="text-2xl font-semibold text-ink-900">{title}</h2>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </header>

          {children}

          {footer ? <div className="mt-6 text-sm text-slate-500">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
