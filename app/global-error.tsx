// Global error boundary for App Router
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
"use client"
import NextError from "next/error"
import { useEffect } from "react"
import { captureException } from "@/lib/sentry"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    captureException(error, {
      page: typeof window !== "undefined" ? window.location.pathname : "unknown",
      tags: {
        error_type: "global_error_boundary",
        error_digest: error.digest,
      },
      extra: {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    })
  }, [error])

  return (
    <html>
      <body>
        {/* NextError is the default Next.js error page component. 
            Its type definition requires a statusCode prop. However, 
            since the App Router does not expose status codes for errors, 
            we simply pass 0 to render a generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
