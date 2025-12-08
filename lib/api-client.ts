import { createClient } from "@/lib/supabase/client"

export class APIClient {
  private supabase = createClient()

  // Lead management
  async getLeads(franchisorId: string) {
    const response = await fetch(`/api/leads?franchisor_id=${franchisorId}`)
    if (!response.ok) throw new Error("Failed to fetch leads")
    return response.json()
  }

  async createLead(data: {
    franchise_id: string
    email: string
    name?: string
    phone?: string
    source: string
  }) {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to create lead")
    return response.json()
  }

  async sendFDDLink(leadId: string) {
    const response = await fetch("/api/leads/send-fdd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    })
    if (!response.ok) throw new Error("Failed to send FDD link")
    return response.json()
  }

  // Engagement tracking
  async trackEngagement(data: {
    lead_id: string
    event_type: string
    metadata?: any
  }) {
    const response = await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to track engagement")
    return response.json()
  }

  // Verification
  async updateVerification(data: {
    buyer_profile_id: string
    fico_score?: number
    plaid_connected?: boolean
    background_check_completed?: boolean
  }) {
    const response = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to update verification")
    return response.json()
  }

  // Franchises
  async getFranchises(franchisorId?: string) {
    const url = franchisorId ? `/api/franchises?franchisor_id=${franchisorId}` : "/api/franchises"
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch franchises")
    return response.json()
  }

  async createFranchise(data: {
    name: string
    franchise_fee: number
    investment_min: number
    investment_max: number
    fdd_url?: string
  }) {
    const response = await fetch("/api/franchises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to create franchise")
    return response.json()
  }

  // Pre-approvals
  async getPreApprovals(buyerId?: string, lenderId?: string) {
    const params = new URLSearchParams()
    if (buyerId) params.append("buyer_id", buyerId)
    if (lenderId) params.append("lender_id", lenderId)

    const response = await fetch(`/api/pre-approval?${params}`)
    if (!response.ok) throw new Error("Failed to fetch pre-approvals")
    return response.json()
  }

  async requestPreApproval(data: {
    franchise_id: string
    lender_id: string
    requested_amount: number
  }) {
    const response = await fetch("/api/pre-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to request pre-approval")
    return response.json()
  }

  // Profile
  async getProfile() {
    const response = await fetch("/api/auth/profile")
    if (!response.ok) throw new Error("Failed to fetch profile")
    return response.json()
  }

  async updateProfile(data: any) {
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to update profile")
    return response.json()
  }
}

export const apiClient = new APIClient()
