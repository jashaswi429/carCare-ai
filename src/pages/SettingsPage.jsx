import { Badge, Button, Card, CardHeader, DataRow, PageHeader } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { isDemoMode } from '@/data/backend'

const PLANS = [
  { name: 'Free', price: '₹0', body: 'One vehicle, basic tracking and basic reminders.', tone: 'neutral' },
  { name: 'Plan 1', price: '₹299/mo', body: 'AI invoice reading, assistant and full service history.', tone: 'brand' },
  { name: 'Plan 2', price: '₹599/mo', body: 'Expense forecasting and enhanced invoice analysis.', tone: 'brand' },
  { name: 'Plan 3', price: '₹999/mo', body: 'Multiple vehicles, advanced analytics, priority features.', tone: 'brand' },
]

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Account & data"
        description="Your profile, connection status and privacy controls."
      />

      <Card>
        <CardHeader icon="user" title="Your account" />
        <div className="px-5 py-3">
          <DataRow label="Name" value={user?.full_name || 'Not provided'} icon="user" />
          <DataRow label="Email" value={user?.email} icon="mail" />
          <DataRow label="Member since" value={formatDate(user?.created_at)} icon="clock" />
          <DataRow label="User ID" value={<span className="font-mono text-xs">{user?.id}</span>} />
        </div>
      </Card>

      <Card>
        <CardHeader
          icon="shield"
          title="Data & privacy"
          subtitle="How your vehicle data is protected"
          action={<Badge tone={isDemoMode ? 'warning' : 'success'}>{isDemoMode ? 'Demo storage' : 'Supabase'}</Badge>}
        />
        <ul className="space-y-3 p-5 pt-3">
          {[
            isDemoMode
              ? 'Demo mode stores everything in this browser profile only. No data leaves your device.'
              : 'Data is stored in your Supabase project and protected by row level security — you can only ever read your own rows.',
            'AI provider keys never touch the browser: all AI calls will run server-side through Edge Functions.',
            'Only the data the maintenance engine needs is collected — no location tracking, no driving surveillance.',
            'You can delete a vehicle at any time, which removes its maintenance schedule with it.',
          ].map((item) => (
            <li key={item} className="flex gap-3 text-sm text-slate-600">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          icon="wallet"
          title="Subscription"
          subtitle="Pricing is provisional and under validation"
          action={<Badge tone="brand">Currently on Free</Badge>}
        />
        <div className="grid gap-3 p-5 pt-3 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div key={plan.name} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-800">{plan.name}</p>
                <p className="text-sm font-medium text-brand-600">{plan.price}</p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{plan.body}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Payments and plan enforcement ship in a later phase. Nothing is charged today.
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink-800">Session</h3>
            <p className="mt-1 text-xs text-slate-500">
              Signed in as {user?.email}. Signing out keeps all saved data.
            </p>
          </div>
          <Button variant="secondary" icon="logout" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
