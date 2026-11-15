/**
 * Rendered when the application cannot start because required configuration is
 * missing (a production build without a Supabase project).
 *
 * It intentionally contains no configuration values and no technical detail, so
 * nothing sensitive can leak to the page, the DOM, or a screenshot.
 * See src/config/env.js for the fail-closed rule.
 */
export function ConfigurationErrorScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f6f7fb] px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-ink-900">This application cannot start</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          A required configuration setting is missing or invalid, so the application stopped
          instead of running in an unsafe mode. No data has been lost.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Please contact the application administrator.
        </p>
      </div>
    </div>
  )
}
