/**
 * Single entry point for all data access.
 *
 * Backend selection is resolved exactly once, at module load:
 *   - Supabase configured              -> supabaseBackend (production and dev)
 *   - No Supabase config, dev or test  -> localBackend (Local Demo Mode)
 *   - No Supabase config, PRODUCTION   -> ConfigurationError (fail closed)
 *
 * Consequence: a production build has NO code path that can select
 * localBackend. The selection logic lives in `@/config/env` so it can be
 * unit tested in isolation.
 */

import { BACKEND_KINDS, resolveBackendKind } from '@/config/env'
import { localBackend } from '@/data/localBackend'
import { supabaseBackend } from '@/data/supabaseBackend'

const backendKind = resolveBackendKind()

// Defence in depth. `resolveBackendKind()` already throws in a production build
// without Supabase, so this is unreachable in practice - it exists so that the
// "production can never select the demo backend" property is explicit and
// independently testable.
if (backendKind === BACKEND_KINDS.LOCAL && isProductionBuild()) {
  throw new Error('The local demo backend cannot be selected in a production build.')
}

function isProductionBuild() {
  return (
    import.meta.env.PROD === true ||
    import.meta.env.PROD === 'true' ||
    import.meta.env.MODE === 'production'
  )
}

export const backend = backendKind === BACKEND_KINDS.SUPABASE ? supabaseBackend : localBackend

/** True when the app is persisting to the browser instead of Supabase. */
export const isDemoMode = backend.mode === 'local'

export const auth = backend.auth
export const db = backend.db
