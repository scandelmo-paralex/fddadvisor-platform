import { BuyerDashboardView } from "@/components/dashboard/buyer-dashboard-view"
import { FranchisorDashboardView } from "@/components/dashboard/franchisor-dashboard-view"
import { LenderDashboardView } from "@/components/dashboard/lender-dashboard-view"

export default function DashboardPage() {
  // Render all dashboard views - they handle their own role-based rendering and auth
  return (
    <>
      <FranchisorDashboardView userId="" />
      <BuyerDashboardView userId="" />
      <LenderDashboardView userId="" />
    </>
  )
}
