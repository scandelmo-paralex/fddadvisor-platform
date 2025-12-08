"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/debug-db")
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] Debug data received:", data)
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("[v0] Debug fetch error:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Database Debug</h1>
          <p>Loading database information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Database Debug Information</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Raw Database Response</h2>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">{JSON.stringify(data, null, 2)}</pre>
        </Card>

        {data?.franchises && data.franchises.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">First Franchise Columns</h2>
            <div className="space-y-2">
              {Object.keys(data.franchises[0]).map((key) => (
                <div key={key} className="flex gap-4 border-b pb-2">
                  <span className="font-mono font-semibold min-w-[200px]">{key}:</span>
                  <span className="text-muted-foreground">
                    {typeof data.franchises[0][key]}
                    {data.franchises[0][key] === null && " (null)"}
                    {data.franchises[0][key] === undefined && " (undefined)"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {data?.franchises && data.franchises.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sample Data (First Franchise)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Name:</h3>
                <p>{data.franchises[0].name || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Investment Breakdown:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(data.franchises[0].investment_breakdown, null, 2) || "undefined"}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold">Franchised Units:</h3>
                <p>{data.franchises[0].franchised_units ?? "undefined"}</p>
              </div>
              <div>
                <h3 className="font-semibold">State Distribution:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(data.franchises[0].state_distribution, null, 2) || "undefined"}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold">Item 19 Data:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(data.franchises[0].item19, null, 2) || "undefined"}
                </pre>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
