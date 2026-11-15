/**
 * Central place where browser-exposed environment values are read.
 * Keeping it in one module means there is exactly one file to audit when
 * asking "what configuration is the client aware of?" (PRD section 8).
 *
 * SECURITY (H-1 remediation):
 * - In a PRODUCTION build, a missing or incomplete Supabase configuration is a
 *   fatal configuration error: the app must fail closed and must never fall
 *   back to the local demo backend.
 * - Local Demo Mode is selectable ONLY when the build is not a production
 *   build (development and test).
 * - Error messages never include the configuration values themselves, so no
 *   project URL or key can leak through an error shown to a user or written to
 *   a log.
 */

const read = (key) => {
  const value = import.meta.env?.[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : ''
}

export const supabaseUrl = read('VITE_SUPABASE_URL')
export const supabaseAnonKey = read('VITE_SUPABASE_ANON_KEY')

/**
 * True only for production builds (`vite build`). False for dev and test.
 * `PROD` is Vite's own flag; `MODE` is checked as well so the value is
 * unambiguous regardless of how the toolchain represents the boolean.
 */
export const isProduction =
  import.meta.env.PROD === true ||
  import.meta.env.PROD === 'true' ||
  import.meta.env.MODE === 'production'

/**
 * True when a Supabase project is configured. When false the app may run in
 * Local Demo Mode - but only outside a production build.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/** The two possible data layers. */
export const BACKEND_KINDS = {
  SUPABASE: 'supabase',
  LOCAL: 'local',
}

/**
 * Safe, non-sensitive message shown when required configuration is missing in
 * a production build. Deliberately contains no URL, key or project identifier.
 */
export const CONFIGURATION_ERROR_MESSAGE =
  'CarCare AI is not configured correctly and cannot start. ' +
  'A required backend configuration is missing. ' +
  'Please contact the application administrator.'

export class ConfigurationError extends Error {
  constructor() {
    super(CONFIGURATION_ERROR_MESSAGE)
    this.name = 'ConfigurationError'
  }
}

/** A value counts as configured only when it is a non-blank string. */
const isPresent = (value) => typeof value === 'string' && value.trim() !== ''

/**
 * Pure decision function - it reads no environment state itself, so it can be
 * unit tested exhaustively.
 *
 * Returns the backend kind to use, or throws ConfigurationError.
 * A production build can NEVER receive BACKEND_KINDS.LOCAL.
 */
export function selectBackendKind({ isProduction: production, url, anonKey }) {
  if (isPresent(url) && isPresent(anonKey)) return BACKEND_KINDS.SUPABASE
  if (production) throw new ConfigurationError()
  return BACKEND_KINDS.LOCAL
}

/**
 * Resolve the backend kind for the running build.
 * Throws ConfigurationError in a production build with no Supabase config.
 */
export function resolveBackendKind() {
  return selectBackendKind({ isProduction, url: supabaseUrl, anonKey: supabaseAnonKey })
}
