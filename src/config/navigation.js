/**
 * Navigation model for the app shell.
 * `phase` marks features that are intentionally not implemented yet, so the
 * roadmap position is visible in the UI instead of hidden (PRD section 10).
 */

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    label: 'My vehicle',
    items: [
      { to: '/vehicles', label: 'Garage', icon: 'car' },
      { to: '/service-history', label: 'Service history', icon: 'wrench', phase: 3 },
      { to: '/invoices', label: 'Invoice reader', icon: 'invoice', phase: 4 },
      { to: '/reminders', label: 'Reminders', icon: 'bell', phase: 6 },
      { to: '/expenses', label: 'Expenses', icon: 'wallet', phase: 7 },
    ],
  },
  {
    label: 'Assistance',
    items: [
      { to: '/assistant', label: 'AI car assistant', icon: 'chat', phase: 5 },
      { to: '/settings', label: 'Settings', icon: 'gear' },
    ],
  },
]

export const APP_ROUTES = Object.fromEntries(
  NAV_SECTIONS.flatMap((section) => section.items.map((item) => [item.to, item.label])),
)
