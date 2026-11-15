import { Link } from 'react-router-dom'
import { Badge, Button } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import { isDemoMode } from '@/data/backend'

const FEATURES = [
  {
    icon: 'gauge',
    title: 'Predictive maintenance',
    body: 'Your schedule is built from manufacturer intervals where we have them, distance driven, time elapsed and your own service history.',
  },
  {
    icon: 'invoice',
    title: 'AI invoice reading',
    body: 'Snap or upload a service bill. We extract the date, odometer, workshop, items, parts and totals for you to verify.',
  },
  {
    icon: 'wallet',
    title: 'Expense forecasting',
    body: 'See an indicative cost range for the work coming up, so a surprise bill becomes a planned expense.',
  },
  {
    icon: 'chat',
    title: 'Car care assistant',
    body: 'Ask what your car needs next, or have a confusing bill explained in plain language - grounded in your own data.',
  },
]

const ROADMAP = [
  { phase: 1, label: 'Foundation', done: true },
  { phase: 2, label: 'Dashboard & maintenance engine', done: true },
  { phase: 3, label: 'Service history' },
  { phase: 4, label: 'AI invoice reader' },
  { phase: 5, label: 'AI assistant' },
  { phase: 6, label: 'Reminders' },
  { phase: 7, label: 'Expense analytics' },
  { phase: 8, label: 'Testing & deployment' },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const primaryTarget = isAuthenticated ? '/dashboard' : '/signup'

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Icon name="car" className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-ink-900">CarCare AI</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button as={Link} to="/login" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button as={Link} to={primaryTarget} size="sm" iconRight="chevronRight">
              {isAuthenticated ? 'Open dashboard' : 'Get started'}
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-ink-900">
          <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <Badge tone="dark" className="bg-white/10 text-slate-200">
                Phase 1 foundation is live
              </Badge>
              <h1 className="mt-5 text-4xl leading-tight font-semibold text-white sm:text-5xl">
                Stop guessing what your car needs next.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
                CarCare AI keeps one digital maintenance profile per vehicle: what has been done, what
                is coming up, what it should cost, and why. Built for Indian car owners, starting now.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button as={Link} to={primaryTarget} size="lg" iconRight="chevronRight">
                  {isAuthenticated ? 'Open dashboard' : 'Create free account'}
                </Button>
                <Button
                  as={Link}
                  to="/login"
                  size="lg"
                  variant="secondary"
                  className="bg-white/10 text-white ring-white/20 hover:bg-white/15"
                >
                  I already have an account
                </Button>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 text-white">
                {[
                  ['11', 'tracked items per vehicle'],
                  ['2', 'reminder channels planned'],
                  ['0', 'API keys in your browser'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-2xl font-semibold">{value}</dt>
                    <dd className="mt-1 text-xs leading-snug text-slate-400">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="rounded-2xl bg-white p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs tracking-wide text-slate-400 uppercase">Vehicle dashboard</p>
                      <p className="text-sm font-semibold text-ink-900">Maruti Suzuki Swift VXi</p>
                    </div>
                    <Badge tone="success">Good standing</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      ['Odometer', '42,500 km'],
                      ['Overdue', '1 item'],
                      ['Next 90 days', '₹4,300+'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] tracking-wide text-slate-400 uppercase">{label}</p>
                        <p className="mt-0.5 text-sm font-medium text-ink-800">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      ['Engine oil replacement', 'Due in 800 km', 'warning'],
                      ['Brake inspection', 'Due in 3 months', 'brand'],
                      ['Battery health check', 'On track', 'success'],
                    ].map(([name, due, tone]) => (
                      <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                        <span className="text-xs font-medium text-ink-800">{name}</span>
                        <Badge tone={tone}>{due}</Badge>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    Illustrative interface. Every value in the product is labelled as manufacturer
                    schedule, rule-based estimate, AI suggestion or confirmed diagnostic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-ink-900">What the platform does</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Twelve core capabilities make up the full product. Features ship phase by phase, and each
            screen tells you honestly where it stands.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name={feature.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-800">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold text-ink-900">Roadmap</h2>
            <p className="mt-2 text-sm text-slate-500">Transparent build order - no vapourware.</p>

            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROADMAP.map((item) => (
                <li key={item.phase} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Phase {item.phase}
                    </span>
                    {item.done ? <Badge tone="success">Live</Badge> : <Badge tone="neutral">Planned</Badge>}
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink-800">{item.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold text-ink-900">Honesty is part of the product</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            CarCare AI does not read your ECU, cannot see your engine and will never claim a failed
            component without validated data. What it does is keep your maintenance schedule accurate,
            explain your bills and flag what needs attention - clearly labelled as an estimate
            whenever it is one.
          </p>
          <div className="mt-8">
            <Button as={Link} to={primaryTarget} size="lg" iconRight="chevronRight">
              {isAuthenticated ? 'Open dashboard' : 'Start with your first vehicle'}
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {isDemoMode
              ? 'Running in local demo mode: accounts are stored in your browser only.'
              : 'Connected to your Supabase project.'}
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CarCare AI · India first, cars first.</p>
          <p>Estimates are guidance, not confirmed diagnostics.</p>
        </div>
      </footer>
    </div>
  )
}
