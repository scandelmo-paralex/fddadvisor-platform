import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import { NotificationProvider } from "@/components/notification-provider"
import { polyfillScript } from "@/lib/polyfill-script"
import "./globals.css"

export const metadata: Metadata = {
  title: "FDDHub",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Safari compatibility polyfills - must run before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: polyfillScript }} />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <NotificationProvider>{children}</NotificationProvider>
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  )
}
