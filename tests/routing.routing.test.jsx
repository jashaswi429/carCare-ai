// @vitest-environment jsdom
/**
 * Routing / authentication behaviour tests (M-3 remediation).
 *
 * These tests exist because the React Router upgrade changed a core runtime
 * dependency. They pin the *observable* routing contract so a future router
 * change cannot silently break:
 *   - public routes
 *   - the protected-route gate (unauthenticated -> /login, with `state.from`)
 *   - the `/app` -> `/dashboard` redirect
 *   - the unknown-route fallback
 *   - the post-sign-in redirect back to the originally requested route
 *
 * They run against the REAL `App` route tree and the REAL `AuthProvider`, using
 * Local Demo Mode (the backend selected in the test environment), so they also
 * double as a regression check that the demo backend is still reachable.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '@/App'
import { backend } from '@/data/backend'

/** Exposes the router's current location so redirects can be asserted. */
function RouteProbe() {
  const location = useLocation()
  return (
    <span data-testid="current-path" data-from={location.state?.from ?? ''}>
      {location.pathname}
    </span>
  )
}

/**
 * @param {import('react-router-dom').InitialEntry[]} entries
 */
function renderApp(entries) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <App />
      <RouteProbe />
    </MemoryRouter>,
  )
}

const currentPath = () => screen.getByTestId('current-path').textContent
const currentFrom = () => screen.getByTestId('current-path').getAttribute('data-from')

/** Write a signed-in account into Local Demo Mode storage (no session). */
function seedAccount() {
  const user = {
    id: 'user-1',
    email: 'driver@example.com',
    full_name: 'Test Driver',
    // Local Demo Mode stores a btoa() obfuscation, not a hash. ASCII only here.
    password: btoa('secret123'),
    created_at: new Date().toISOString(),
  }
  window.localStorage.setItem('acc.users', JSON.stringify([user]))
  return user
}

/** Seed a signed-in session in Local Demo Mode storage. */
function seedSignedInUser() {
  const user = seedAccount()
  window.localStorage.setItem(
    'acc.session',
    JSON.stringify({ userId: user.id, createdAt: new Date().toISOString() }),
  )
  return user
}

beforeEach(() => {
  window.localStorage.clear()
  // jsdom does not implement scrolling; AppLayout resets scroll on navigation.
  window.scrollTo = () => {}
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('test harness assumptions', () => {
  it('runs against the Local Demo backend', () => {
    // If this is ever false the auth-gate tests below would be exercising the
    // wrong data layer, so fail loudly instead of testing nothing.
    expect(backend.mode).toBe('local')
  })
})

describe('public routes', () => {
  it('renders the landing page at "/"', async () => {
    renderApp(['/'])
    expect(await screen.findByText(/stop guessing what your car needs next/i)).toBeTruthy()
    expect(currentPath()).toBe('/')
  })

  it('renders the sign-in page at "/login"', async () => {
    renderApp(['/login'])
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
    expect(currentPath()).toBe('/login')
  })
})

describe('protected routes (unauthenticated)', () => {
  it('redirects a direct visit to /dashboard to /login and remembers the target', async () => {
    renderApp(['/dashboard'])

    await waitFor(() => expect(currentPath()).toBe('/login'))
    expect(currentFrom()).toBe('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy()
  })

  it('redirects other protected routes to /login', async () => {
    renderApp(['/vehicles'])

    await waitFor(() => expect(currentPath()).toBe('/login'))
    expect(currentFrom()).toBe('/vehicles')
  })

  it('does not render protected content while unauthenticated', async () => {
    renderApp(['/reminders'])

    await waitFor(() => expect(currentPath()).toBe('/login'))
    expect(screen.queryByText(/maintenance reminders/i)).toBeNull()
  })
})

describe('protected routes (authenticated)', () => {
  it('renders the dashboard for a signed-in user', async () => {
    seedSignedInUser()
    renderApp(['/dashboard'])

    expect(await screen.findByText(/vehicle dashboard/i)).toBeTruthy()
    expect(currentPath()).toBe('/dashboard')
  })

  it('redirects "/app" to "/dashboard"', async () => {
    seedSignedInUser()
    renderApp(['/app'])

    await waitFor(() => expect(currentPath()).toBe('/dashboard'))
  })

  it('sends an already signed-in user on "/login" back to state.from', async () => {
    seedSignedInUser()
    renderApp([{ pathname: '/login', state: { from: '/reminders' } }])

    await waitFor(() => expect(currentPath()).toBe('/reminders'))
    expect(await screen.findByText(/maintenance reminders/i)).toBeTruthy()
  })

  it('defaults an already signed-in user on "/login" to /dashboard without state.from', async () => {
    seedSignedInUser()
    renderApp(['/login'])

    await waitFor(() => expect(currentPath()).toBe('/dashboard'))
  })
})

describe('unknown routes', () => {
  it('renders the not-found page for an unknown path', async () => {
    renderApp(['/this-route-does-not-exist'])

    expect(await screen.findByText(/page not found/i)).toBeTruthy()
    expect(currentPath()).toBe('/this-route-does-not-exist')
  })

  it('renders the not-found page for an unknown nested path', async () => {
    renderApp(['/vehicles/123/extra'])

    expect(await screen.findByText(/page not found/i)).toBeTruthy()
  })

  it('renders the not-found page for an unknown path even when signed in', async () => {
    seedSignedInUser()
    renderApp(['/nope'])

    expect(await screen.findByText(/page not found/i)).toBeTruthy()
  })
})

describe('sign-in round trip', () => {
  it('returns the user to the originally requested protected route', async () => {
    // Account exists but there is no session yet: the user must sign in.
    seedAccount()
    renderApp(['/vehicles'])

    // Unauthenticated first: bounced to /login with the intended target stored.
    await waitFor(() => expect(currentPath()).toBe('/login'))
    expect(currentFrom()).toBe('/vehicles')

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'driver@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => expect(currentPath()).toBe('/vehicles'))
  })
})
