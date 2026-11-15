import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { resolveBackendKind } from '@/config/env'
import { ConfigurationErrorScreen } from '@/components/system/ConfigurationErrorScreen'

const root = ReactDOM.createRoot(document.getElementById('root'))

const renderConfigurationError = () => {
  root.render(<ConfigurationErrorScreen />)
}

/**
 * Fail closed.
 *
 * The runtime configuration is resolved BEFORE the application is imported. In
 * a production build with missing Supabase configuration this throws a
 * ConfigurationError, so the app never boots and the insecure local demo
 * backend can never be reached. The user sees a safe configuration screen
 * instead of a login form that would accept real passwords.
 */
try {
  resolveBackendKind()

  import('./App.jsx')
    .then(({ default: App }) => {
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </React.StrictMode>,
      )
    })
    .catch(renderConfigurationError)
} catch {
  renderConfigurationError()
}
