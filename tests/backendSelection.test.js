import { describe, expect, it } from 'vitest'
import {
  BACKEND_KINDS,
  ConfigurationError,
  CONFIGURATION_ERROR_MESSAGE,
  selectBackendKind,
} from '@/config/env'

/**
 * Unit tests for the pure backend-selection rule (H-1).
 * No environment access, so every combination can be asserted directly.
 */
describe('selectBackendKind', () => {
  it('selects the local demo backend in development when Supabase is not configured', () => {
    expect(selectBackendKind({ isProduction: false, url: '', anonKey: '' })).toBe(
      BACKEND_KINDS.LOCAL,
    )
  })

  it('selects Supabase in development when configured', () => {
    expect(
      selectBackendKind({ isProduction: false, url: 'https://x.supabase.co', anonKey: 'anon' }),
    ).toBe(BACKEND_KINDS.SUPABASE)
  })

  it('selects Supabase in production when configured', () => {
    expect(
      selectBackendKind({ isProduction: true, url: 'https://x.supabase.co', anonKey: 'anon' }),
    ).toBe(BACKEND_KINDS.SUPABASE)
  })

  it('fails closed in production when Supabase is not configured', () => {
    expect(() => selectBackendKind({ isProduction: true, url: '', anonKey: '' })).toThrow(
      ConfigurationError,
    )
  })

  it('treats blank / whitespace / missing values as not configured', () => {
    expect(selectBackendKind({ isProduction: false, url: '   ', anonKey: '   ' })).toBe(
      BACKEND_KINDS.LOCAL,
    )
    expect(selectBackendKind({ isProduction: false, url: undefined, anonKey: undefined })).toBe(
      BACKEND_KINDS.LOCAL,
    )
    expect(() => selectBackendKind({ isProduction: true, url: '   ', anonKey: 'anon' })).toThrow(
      ConfigurationError,
    )
    expect(() => selectBackendKind({ isProduction: true, url: 'https://x.supabase.co', anonKey: ' ' })).toThrow(
      ConfigurationError,
    )
  })

  it('requires both halves of the configuration', () => {
    expect(() => selectBackendKind({ isProduction: true, url: 'https://x.supabase.co' })).toThrow(
      ConfigurationError,
    )
    expect(() => selectBackendKind({ isProduction: true, anonKey: 'anon' })).toThrow(
      ConfigurationError,
    )
  })

  it('never selects the local backend in production, for any input combination', () => {
    const values = [undefined, null, '', '   ', 'x', 'https://x.supabase.co', 'anon', 0, false]
    for (const url of values) {
      for (const anonKey of values) {
        let outcome
        try {
          outcome = selectBackendKind({ isProduction: true, url, anonKey })
        } catch (error) {
          outcome = error
        }
        expect(outcome).not.toBe(BACKEND_KINDS.LOCAL)
      }
    }
  })

  it('does not leak configuration values in the error message', () => {
    const secretKey = 'super-secret-anon-key-value'
    let error
    try {
      selectBackendKind({ isProduction: true, url: 'https://leaky-project.supabase.co', anonKey: '' })
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(ConfigurationError)
    expect(error.message).toBe(CONFIGURATION_ERROR_MESSAGE)
    expect(error.message).not.toContain('leaky-project')
    expect(error.message).not.toContain(secretKey)
    expect(error.message).not.toContain('supabase.co')
  })
})
