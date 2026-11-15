/**
 * Roadmap placeholders.
 *
 * These routes exist so the navigation is complete and the roadmap position is
 * visible in the product. They deliberately contain no fake data and no
 * half-built feature: each one states what will be built, in which phase, and
 * what data it will need (PRD section 10).
 */

import { Link } from 'react-router-dom'
import { Alert, Badge, Button, Card, CardHeader, PageHeader } from '@/components/ui/Primitives'
import { Icon } from '@/components/ui/Icons'

function PlannedPhasePage({ phase, eyebrow, title, description, icon, capabilities, dependsOn }) {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Badge tone="brand" icon="clock">
              Scheduled: Phase {phase}
            </Badge>
            <Button as={Link} to="/dashboard" variant="secondary" icon="dashboard">
              Back to dashboard
            </Button>
          </>
        }
      />

      <Alert tone="info" title="Not built yet - by design">
        Phase 1 delivers the foundation: application shell, authentication, database, vehicle
        onboarding and the predictive maintenance engine. This screen becomes functional in Phase {phase}.
      </Alert>

      <Card>
        <CardHeader icon={icon} title="What this screen will do" subtitle="Planned behaviour, sourced from the product requirements" />
        <ul className="space-y-3 p-5 pt-3">
          {capabilities.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-slate-600">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader icon="shield" title="Depends on" subtitle="Data and guarantees this feature needs before it ships" />
        <ul className="space-y-3 p-5 pt-3">
          {dependsOn.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-slate-600">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export function ServiceHistoryPage() {
  return (
    <PlannedPhasePage
      phase={3}
      eyebrow="Service history"
      title="Digital service history"
      icon="wrench"
      description="A chronological record of every service, workshop visit and expense for each vehicle."
      capabilities={[
        'Add, edit and delete service records with date, odometer, workshop and items replaced.',
        'Attach the invoice file to each record and search the full history.',
        'Automatic recalculation of the maintenance schedule after each new record.',
      ]}
      dependsOn={[
        'service_records table (already created in the Phase 1 database schema).',
        'User verification of every figure before it is written to history.',
      ]}
    />
  )
}

export function InvoicesPage() {
  return (
    <PlannedPhasePage
      phase={4}
      eyebrow="Invoice reader"
      title="AI service invoice reader"
      icon="invoice"
      description="Upload a PDF, JPG or PNG service bill and have the key values extracted for your review."
      capabilities={[
        'Extract service date, odometer, workshop name, items, parts, labour, taxes and totals.',
        'Extract the next recommended service date and odometer reading.',
        'Review and correct every extracted field before saving it to history.',
        'Reuse previously extracted invoices instead of paying to analyse them twice.',
      ]}
      dependsOn={[
        'Server-side AI calls through a Supabase Edge Function so no API key reaches the browser.',
        'Supabase Storage bucket with per-user access policies (already provisioned).',
        'Per-tier AI usage limits and file-size caps to protect the AI budget.',
      ]}
    />
  )
}

export function AssistantPage() {
  return (
    <PlannedPhasePage
      phase={5}
      eyebrow="AI car assistant"
      title="AI car care assistant"
      icon="chat"
      description="Ask questions about your vehicle and get answers grounded in your own maintenance data."
      capabilities={[
        '“What maintenance does my car need next?” - answered from the live schedule.',
        '“Explain my latest service bill” - line-by-line explanation in simple language.',
        'Bill analysis and potential-issue guidance, always framed as possibilities, never diagnoses.',
        'Helpers to prepare questions for your mechanic.',
      ]}
      dependsOn={[
        'A complete vehicle profile and service history to ground the answers.',
        'Explicit uncertainty handling whenever the available data is insufficient.',
        'Usage limits per subscription tier.',
      ]}
    />
  )
}

export function RemindersPage() {
  return (
    <PlannedPhasePage
      phase={6}
      eyebrow="Reminders"
      title="Maintenance reminders"
      icon="bell"
      description="Timely reminders based on your odometer, service history and manufacturer intervals."
      capabilities={[
        'In-app and email reminders for upcoming servicing, oil changes, filters, tyres and battery checks.',
        'Due-date and due-distance calculation from the same predictive engine used on your dashboard.',
        'Quiet hours and per-item opt-out so reminders stay useful, not noisy.',
      ]}
      dependsOn={[
        'notifications table (already created in the Phase 1 database schema).',
        'A scheduled server job to evaluate due items daily.',
        'An email provider configured server-side.',
      ]}
    />
  )
}

export function ExpensesPage() {
  return (
    <PlannedPhasePage
      phase={7}
      eyebrow="Expenses"
      title="Expense analytics & forecasting"
      icon="wallet"
      description="Understand what you spend on your car and what is coming next."
      capabilities={[
        'Monthly and yearly maintenance spend, split by category and workshop.',
        'Forward cost estimates shown as ranges, based on vehicle model, age and your history.',
        'Comparisons between quoted work and your historical spend.',
      ]}
      dependsOn={[
        'expenses table (already created in the Phase 1 database schema).',
        'Enough confirmed service records to make trends meaningful.',
        'Regional cost data - ranges, never guaranteed prices.',
      ]}
    />
  )
}
