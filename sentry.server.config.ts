// Sentry server-side initialization
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
