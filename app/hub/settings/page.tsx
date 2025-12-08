import { WhiteLabelSettings } from "@/components/white-label-settings"

export default function SettingsPage() {
  // TODO: Get actual franchise ID from user session
  const franchiseId = "default-franchise-id"
  const franchiseName = "Your Franchise"

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">FDDHub Settings</h1>
        <p className="text-muted-foreground mt-2">Customize how your franchise appears to leads</p>
      </div>

      <WhiteLabelSettings franchiseId={franchiseId} franchiseName={franchiseName} />
    </div>
  )
}
