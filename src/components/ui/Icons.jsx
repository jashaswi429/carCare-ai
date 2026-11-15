/**
 * Dependency-free icon set (stroke based, inherits currentColor).
 * Add new icons by extending the ICONS map - no extra package required.
 */

const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  car: (
    <>
      <path d="M5 17h14M3 17v-4.2a2 2 0 0 1 .2-.9l1.9-4.1A2 2 0 0 1 6.9 6.6h10.2a2 2 0 0 1 1.8 1.2l1.9 4.1a2 2 0 0 1 .2.9V17" />
      <path d="M4.5 12.5h15" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0 5 5.2l-9 9a2.8 2.8 0 0 1-4-4l9-9a4 4 0 0 0-1 2.8z" />
  ),
  invoice: (
    <>
      <path d="M6 2.5h9l3.5 3.5V21a.5.5 0 0 1-.5.5H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
      <path d="M14.5 2.5V6.5h4" />
      <path d="M8.5 12h7M8.5 16h4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </>
  ),
  chat: (
    <path d="M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 0 1 12 4h1a8 8 0 0 1 8 8z" />
  ),
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
      <rect x="3" y="7.5" width="18" height="11.5" rx="2.5" />
      <path d="M16.5 13.5h1.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M2.8 12h2.4M18.8 12h2.4M5.4 18.6l1.7-1.7M16.9 7.1l1.7-1.7" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  logout: (
    <>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  alert: (
    <>
      <path d="M10.3 3.9L1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 4.9L18.7 10l-4.9 1.8L12 16.8l-1.8-5L5.3 10l4.9-2.1z" />
      <path d="M18.5 16.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.6 5.9A9.6 9.6 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a17 17 0 0 1-2.6 3.2M6.2 8.3A16.6 16.6 0 0 0 2.5 12S6 17.5 12 17.5a9.9 9.9 0 0 0 3.4-.6" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l.8 12A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.9l.8-12" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h8" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path d="M12 14l4-4" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 21V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15" />
      <path d="M3 21h11M4 10h9" />
      <path d="M17 8l2 2v8a2 2 0 0 0 4 0v-6l-2.5-4.5" />
    </>
  ),
  shield: (
    <path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.6L4 8" />
      <path d="M4 4v4h4M4 13a8 8 0 0 0 14.3 4.6L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  road: (
    <>
      <path d="M6 3l-2 18M18 3l2 18M12 4v3M12 10v3M12 16v3" />
    </>
  ),
}

export function Icon({ name, className = 'h-5 w-5', ...rest }) {
  const shape = ICONS[name]
  if (!shape) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {shape}
    </svg>
  )
}
