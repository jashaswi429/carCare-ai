import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Integration tests for runtime backend resolution (H-1).
 *
 * Each case stubs the environment, resets the module registry, then imports the
 * real `@/data/backend` module so the production/dev decision is exercised end
 * to end rather than only through the pure helper.
 */
const SUPABASE_URL = 'https://example-project.supabase.co'
const SUPABASE_ANON_KEY = 'test-anon-key'

async function importBackend() {
  vi.resetModules()
  return import('@/data/backend')
}

function stubAsProduction() {
  vi.stubEnv('PROD', true)
  vi.stubEnv('DEV', false)
  vi.stubEnv('MODE', 'production')
}

function stubAsDevelopment() {
  vi.stubEnv('PROD', false)
  vi.stubEnv('DEV', true)
  vi.stubEnv('MODE', 'development')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('runtime backend resolution', () => {
  it('development without Supabase configuration uses Local Demo Mode', async () => {
    stubAsDevelopment()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { backend, isDemoMode } = await importBackend()

    expect(backend.mode).toBe('local')
    expect(isDemoMode).toBe(true)
  })

  it('production without Supabase configuration fails closed', async () => {
    stubAsProduction()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    await expect(importBackend()).rejects.toMatchObject({ name: 'ConfigurationError' })
  })

  it('production with valid Supabase configuration uses the Supabase backend', async () => {
    stubAsProduction()
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY)

    const { backend, isDemoMode, auth, db } = await importBackend()

    expect(backend.mode).toBe('supabase')
    expect(isDemoMode).toBe(false)
    expect(typeof auth.signIn).toBe('function')
    expect(typeof db.listVehicles).toBe('function')
  })

  it('no partial production configuration can resolve to the local backend', async () => {
    stubAsProduction()
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '') // one half missing

    await expect(importBackend()).rejects.toMatchObject({ name: 'ConfigurationError' })
  })

  it('development with valid Supabase configuration uses the Supabase backend', async () => {
    stubAsDevelopment()
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY)

    const { backend, isDemoMode } = await importBackend()

    expect(backend.mode).toBe('supabase')
    expect(isDemoMode).toBe(false)
  })
})
