import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * M-2 remediation guard: HTTP security headers for the Vercel deployment.
 *
 * These assertions pin the deployed security-header contract so a future edit
 * cannot silently drop a header or weaken the Content-Security-Policy. They
 * validate the CONFIGURATION (the only artefact verifiable without a live
 * deployment edge); they do not prove what a real edge actually returns.
 */

const configPath = path.join(process.cwd(), 'vercel.json')
const config = JSON.parse(readFileSync(configPath, 'utf8'))

const headerRules = config.headers ?? []
const allHeaders = headerRules.flatMap((rule) => rule.headers ?? [])
const valuesFor = (key) =>
  allHeaders.filter((h) => h.key.toLowerCase() === key.toLowerCase()).map((h) => h.value)
const valueFor = (key) => valuesFor(key).join('\n')

const csp = valueFor('Content-Security-Policy')
const cspDirectives = csp
  .split(';')
  .map((part) => part.trim())
  .filter(Boolean)
const directive = (name) =>
  cspDirectives.find((d) => d === name || d.startsWith(`${name} `)) ?? ''

describe('vercel.json structure', () => {
  it('defines a non-empty headers array', () => {
    expect(Array.isArray(headerRules)).toBe(true)
    expect(headerRules.length).toBeGreaterThan(0)
  })

  it('applies headers to every path', () => {
    const coversAll = headerRules.some((rule) => rule.source === '/(.*)')
    expect(coversAll).toBe(true)
  })

  it('gives every header a key and a non-empty string value', () => {
    expect(allHeaders.length).toBeGreaterThan(0)
    for (const header of allHeaders) {
      expect(typeof header.key).toBe('string')
      expect(header.key.length).toBeGreaterThan(0)
      expect(typeof header.value).toBe('string')
      expect(header.value.length).toBeGreaterThan(0)
    }
  })

  it('does not declare the same header key twice', () => {
    const keys = allHeaders.map((h) => h.key.toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('required security headers', () => {
  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Cross-Origin-Opener-Policy', 'same-origin'],
    ['X-DNS-Prefetch-Control', 'off'],
  ])('sets %s to "%s"', (key, expected) => {
    expect(valuesFor(key)).toEqual([expected])
  })

  it('enables HSTS with a long max-age, subdomains and preload', () => {
    const hsts = valueFor('Strict-Transport-Security')
    expect(hsts).toMatch(/max-age=(\d{7,})/)
    expect(hsts).toContain('includeSubDomains')
    expect(hsts).toContain('preload')
  })

  it('locks down powerful browser features via Permissions-Policy', () => {
    const policy = valueFor('Permissions-Policy')
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
      expect(policy).toContain(`${feature}=()`)
    }
  })
})

describe('Content-Security-Policy', () => {
  it('is present exactly once', () => {
    expect(valuesFor('Content-Security-Policy')).toHaveLength(1)
  })

  it('defaults to same-origin and locks down dangerous sinks', () => {
    expect(directive('default-src')).toBe("default-src 'self'")
    expect(directive('base-uri')).toBe("base-uri 'self'")
    expect(directive('object-src')).toBe("object-src 'none'")
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(directive('form-action')).toBe("form-action 'self'")
  })

  it("allows scripts only from 'self' with no inline/eval escape hatches", () => {
    const scriptSrc = directive('script-src')
    expect(scriptSrc).toContain("'self'")
    // The production build emits no inline scripts (verified: dist/index.html
    // references only external /assets/*.js), so 'unsafe-inline'/'unsafe-eval'
    // must never be needed.
    expect(scriptSrc).not.toContain('unsafe-inline')
    expect(scriptSrc).not.toContain('unsafe-eval')
    expect(scriptSrc).not.toContain('http:')
    expect(scriptSrc).not.toContain('https:')
  })

  it("allows styles from 'self' (plus inline styles required by React)", () => {
    const styleSrc = directive('style-src')
    expect(styleSrc).toContain("'self'")
    expect(styleSrc).toContain("'unsafe-inline'")
  })

  it('allows the Supabase REST and Realtime endpoints over HTTPS and WSS', () => {
    const connectSrc = directive('connect-src')
    expect(connectSrc).toContain("'self'")
    expect(connectSrc).toContain('https://*.supabase.co')
    expect(connectSrc).toContain('wss://*.supabase.co')
  })

  it("allows images from 'self' and Supabase Storage", () => {
    const imgSrc = directive('img-src')
    expect(imgSrc).toContain("'self'")
    expect(imgSrc).toContain('data:')
    expect(imgSrc).toContain('blob:')
    expect(imgSrc).toContain('https://*.supabase.co')
  })

  it('forces HTTPS for same-origin subresources', () => {
    expect(directive('upgrade-insecure-requests')).toBe('upgrade-insecure-requests')
  })

  it('never widens to a wildcard or bare scheme source', () => {
    expect(csp).not.toMatch(/(^|[\s;])\*($|[\s;])/)
    expect(csp).not.toMatch(/default-src[^;]*\*/)
  })
})
