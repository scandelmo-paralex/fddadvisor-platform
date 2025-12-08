// Test page for verifying Sentry setup
// Click the button to trigger a test error
"use client"

import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SentryExamplePage() {
  const triggerClientError = () => {
    throw new Error("Sentry Test Error - Client Side")
  }

  const triggerServerError = async () => {
    await Sentry.startSpan(
      {
        name: "Example Frontend Span",
        op: "test",
      },
      async () => {
        const res = await fetch("/api/sentry-example-api")
        if (!res.ok) {
          throw new Error("Sentry Example Frontend Error")
        }
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sentry Test Page</CardTitle>
          <CardDescription>
            Use these buttons to verify Sentry is capturing errors correctly. Check your Sentry dashboard after
            clicking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="destructive" className="w-full" onClick={triggerClientError}>
            Trigger Client-Side Error
          </Button>
          <Button variant="outline" className="w-full bg-transparent" onClick={triggerServerError}>
            Trigger Server-Side Error (with Trace)
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            After clicking, check your{" "}
            <a
              href="https://paralex-inc.sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Sentry dashboard
            </a>{" "}
            for the captured errors.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
