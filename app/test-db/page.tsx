"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

export default function TestDBPage() {
  const [status, setStatus] = useState<string>("Loading...")
  const [franchises, setFranchises] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus("Fetching from /api/franchises/public...")
        const response = await fetch("/api/franchises/public")

        setStatus(`Response status: ${response.status}`)

        if (!response.ok) {
          setError(`API returned ${response.status}`)
          return
        }

        const data = await response.json()
        setStatus(`Success! Found ${data.length} franchises`)
        setFranchises(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setStatus("Error occurred")
      }
    }

    testConnection()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

      <Card className="p-6 mb-4">
        <h2 className="font-semibold mb-2">Status:</h2>
        <p>{status}</p>
        {error && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">Error: {error}</div>}
      </Card>

      {franchises.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Franchises ({franchises.length}):</h2>
          <div className="space-y-2">
            {franchises.map((f, i) => (
              <div key={i} className="p-3 bg-muted rounded">
                <div className="font-medium">{f.name}</div>
                <div className="text-sm text-muted-foreground">
                  Score: {f.franchise_score} | Units: {f.total_units} | Investment: $
                  {(f.initial_investment_low / 1000).toFixed(0)}K - ${(f.initial_investment_high / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
