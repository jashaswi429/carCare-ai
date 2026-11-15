import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Dedicated Vitest config so the test run does not load the Vite/Tailwind build
 * plugins. Only the `@` alias needs to match src/vite.config.js.
 */
export default defineConfig({
  // The app's Vite config uses @vitejs/plugin-react (automatic JSX runtime).
  // Mirror that transform here so component tests compile JSX the same way,
  // without loading the Tailwind build plugin.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    // Default environment is `node` for the fast, dependency-free suites.
    // Browser-dependent suites opt in per file with a
    // `// @vitest-environment jsdom` docblock (see tests/routing.routing.test.jsx).
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
