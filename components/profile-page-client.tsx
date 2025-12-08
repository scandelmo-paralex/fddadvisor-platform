"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { ProfileSettings } from "@/components/profile-settings-cleaned"
import { Header } from "@/components/header"
import type { BuyerProfile } from "@/lib/data"

interface ProfilePageClientProps {
  userId: string
  userEmail: string
}

export function ProfilePageClient({ userId, userEmail }: ProfilePageClientProps) {
  const [profile, setProfile] = useState<BuyerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        console.log("[Profile] Loading profile for user:", userId)
        const supabase = createBrowserClient()

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        
        console.log("[Profile] Session check:", {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          matchesUserId: session?.user?.id === userId,
          sessionError,
        })

        const { data: buyerProfileData, error: profileError } = await supabase
          .from("buyer_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()

        console.log("[Profile] Query result:", {
          data: buyerProfileData,
          error: profileError,
          hasData: !!buyerProfileData,
        })

        if (profileError) {
          console.error("[Profile] Profile query error:", profileError)
          throw new Error(`Database error: ${profileError.message}`)
        }

        if (!buyerProfileData) {
          console.log("[Profile] No profile found, creating default profile")
          const { data: newProfile, error: insertError } = await supabase
            .from("buyer_profiles")
            .insert({
              user_id: userId,
              email: userEmail,
              first_name: "",
              last_name: "",
              phone: "",
            })
            .select()
            .single()

          console.log("[Profile] Insert result:", { data: newProfile, error: insertError })

          if (insertError) {
            console.error("[Profile] Failed to create profile:", insertError)
            throw new Error(`Failed to create profile: ${insertError.message}`)
          }
        }

        console.log("[Profile] Profile data loaded:", buyerProfileData)

        const profileData: BuyerProfile = {
          id: userId,
          personalInfo: {
            firstName: buyerProfileData?.first_name || "",
            lastName: buyerProfileData?.last_name || "",
            email: buyerProfileData?.email || userEmail,
            phone: buyerProfileData?.phone || "",
            city: buyerProfileData?.city_location || "",
            state: buyerProfileData?.state_location || "",
            desiredTerritories: buyerProfileData?.desired_territories || "",
            profilePhotoUrl: buyerProfileData?.profile_photo_url || undefined,
            linkedInUrl: buyerProfileData?.linkedin_url || undefined,
          },
          businessExperience: {
            yearsOfExperience: buyerProfileData?.years_of_experience || 0,
            industryExperience: buyerProfileData?.industry_experience || [],
            hasOwnedBusiness: buyerProfileData?.has_owned_business || false,
            managementExperience: buyerProfileData?.management_experience || false,
            currentEmploymentStatus: buyerProfileData?.current_employment_status || "Employed Full-Time",
            relevantSkills: buyerProfileData?.relevant_skills || [],
          },
          financialQualification: {
            ficoScoreRange: buyerProfileData?.fico_score_range || "",
            liquidAssetsRange: buyerProfileData?.liquid_assets_range || "",
            netWorthRange: buyerProfileData?.net_worth_range || "",
            fundingPlans: buyerProfileData?.funding_plans || [],
          },
          backgroundAttestations: {
            noBankruptcyAttestation: buyerProfileData?.no_bankruptcy_attestation || false,
            noFelonyAttestation: buyerProfileData?.no_felony_attestation || false,
            attestedAt: buyerProfileData?.background_attested_at || null,
          },
        }

        setProfile(profileData)
      } catch (err) {
        console.error("[Profile] Error loading profile:", err)
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    setError(null)
    loadProfile()
  }, [userId, userEmail])

  const handleUpdateProfile = async (updatedProfile: BuyerProfile) => {
    try {
      console.log("[Profile] Updating profile:", updatedProfile)
      const supabase = createBrowserClient()

      const updateData = {
        user_id: userId,
        first_name: updatedProfile.personalInfo.firstName,
        last_name: updatedProfile.personalInfo.lastName,
        email: updatedProfile.personalInfo.email,
        phone: updatedProfile.personalInfo.phone,
        city_location: updatedProfile.personalInfo.city,
        state_location: updatedProfile.personalInfo.state,
        desired_territories: updatedProfile.personalInfo.desiredTerritories,
        profile_photo_url: updatedProfile.personalInfo.profilePhotoUrl,
        linkedin_url: updatedProfile.personalInfo.linkedInUrl,
        
        // Business Experience
        years_of_experience: updatedProfile.businessExperience?.yearsOfExperience,
        industry_experience: updatedProfile.businessExperience?.industryExperience,
        has_owned_business: updatedProfile.businessExperience?.hasOwnedBusiness,
        management_experience: updatedProfile.businessExperience?.managementExperience,
        current_employment_status: updatedProfile.businessExperience?.currentEmploymentStatus,
        relevant_skills: updatedProfile.businessExperience?.relevantSkills,
        
        // Financial Qualification
        fico_score_range: updatedProfile.financialQualification?.ficoScoreRange,
        liquid_assets_range: updatedProfile.financialQualification?.liquidAssetsRange,
        net_worth_range: updatedProfile.financialQualification?.netWorthRange,
        funding_plans: updatedProfile.financialQualification?.fundingPlans,
        
        // Background Attestations
        no_bankruptcy_attestation: updatedProfile.backgroundAttestations?.noBankruptcyAttestation,
        no_felony_attestation: updatedProfile.backgroundAttestations?.noFelonyAttestation,
        background_attested_at: updatedProfile.backgroundAttestations?.attestedAt,
      }

      console.log("[Profile] Update data:", updateData)

      const { error } = await supabase
        .from("buyer_profiles")
        .upsert(updateData)
        .eq("user_id", userId)

      if (error) {
        console.error("[Profile] Update error:", error)
        throw error
      }

      setProfile(updatedProfile)
      console.log("[Profile] Profile updated successfully")
      alert("Profile updated successfully!")
    } catch (err) {
      console.error("[Profile] Error updating profile:", err)
      alert("Failed to update profile. Please try again.")
    }
  }

  const user = { id: userId, email: userEmail }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          currentView="profile-settings"
          onViewChange={() => {}}
          onBack={() => {}}
          onNavigate={() => {}}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">Loading profile...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          currentView="profile-settings"
          onViewChange={() => {}}
          onBack={() => {}}
          onNavigate={() => {}}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Profile</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        currentView="profile-settings"
        onViewChange={() => {}}
        onBack={() => {}}
        onNavigate={() => {}}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileSettings profile={profile} onUpdateProfile={handleUpdateProfile} />
      </main>
    </div>
  )
}
