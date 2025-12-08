// Sentry client-side initialization
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adds request headers and IP for users
  sendDefaultPii: true,

  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    // Session Replay integration
    Sentry.replayIntegration(),
    // User Feedback integration
    Sentry.feedbackIntegration({
      colorScheme: "system",
    }),
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})

// This export will instrument router navigations (for tracing)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
