"use client"

import { BuyerDashboard } from "@/components/buyer-dashboard"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"

export function BuyerDashboardView({ userId }: { userId: string }) {
  const router = useRouter()

  // Mock profile for now until database access is fixed
  const mockProfile = {
    id: userId,
    name: "Buyer User",
    email: "buyer@example.com",
    phone: "",
    location: "",
    liquidCapital: 0,
    netWorth: 0,
    creditScore: 0,
    experience: "",
    interests: [],
    timeline: "",
    isVerified: false,
    personalInfo: {
      firstName: "Buyer",
      lastName: "User",
      email: "buyer@example.com",
      phone: "",
      location: "",
    },
    financialQualification: {
      creditScore: 0,
      liquidCapital: 0,
      netWorth: 0,
      backgroundCheck: "Pending",
      preApproval: {
        status: "Pending" as const,
        amount: 0,
        lender: "",
      },
    },
    verificationStatus: {
      identity: "pending" as const,
      financial: "pending" as const,
      background: "pending" as const,
    },
  }

  const handleNavigate = (view: string) => {
    if (view === "profile-settings") {
      router.push("/profile")
    } else if (view === "buyer-dashboard") {
      router.push("/dashboard")
    }
  }

  const handleViewChange = (view: string) => {
    if (view === "profile-settings") {
      router.push("/profile")
    } else if (view === "buyer-dashboard") {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView="buyer-dashboard"
        onViewChange={handleViewChange}
        onBack={() => router.back()}
        onNavigate={handleNavigate}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BuyerDashboard
          onNavigate={handleNavigate}
          onOpenModal={() => {}}
          theme="dark"
          onToggleTheme={() => {}}
          buyerProfile={mockProfile}
        />
      </main>
    </div>
  )
}
