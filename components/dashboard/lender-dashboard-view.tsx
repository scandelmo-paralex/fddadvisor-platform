"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"

export function LenderDashboardView({ userId }: { userId: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Header currentView="lender-dashboard" onViewChange={() => {}} onBack={() => {}} onNavigate={() => {}} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Lender Dashboard</CardTitle>
            <CardDescription>View pre-approval requests from qualified buyers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Lender dashboard coming soon...</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
