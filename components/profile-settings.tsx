"use client"

import type React from "react"

import { useState } from "react"
import {
  User,
  DollarSign,
  Shield,
  Briefcase,
  Linkedin,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react" // Added icons
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { BuyerProfile } from "@/lib/data"
import { franchises, fddEngagements } from "@/lib/data"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Added Avatar components

interface ProfileSettingsProps {
  profile: BuyerProfile
  onUpdateProfile: (profile: BuyerProfile) => void
}

const FICO_SCORE_OPTIONS = [
  { value: "", label: "Select your FICO score range" },
  { value: "780+", label: "780+ (Excellent)" },
  { value: "720-779", label: "720-779 (Very Good)" },
  { value: "680-719", label: "680-719 (Good)" },
  { value: "620-679", label: "620-679 (Fair)" },
  { value: "580-619", label: "580-619 (Poor)" },
  { value: "Under 580", label: "Under 580 (Very Poor)" },
]

const LIQUID_ASSETS_OPTIONS = [
  { value: "", label: "Select your liquid assets range" },
  { value: "$500k+", label: "$500,000+" },
  { value: "$250-500k", label: "$250,000 - $500,000" },
  { value: "$100-250k", label: "$100,000 - $250,000" },
  { value: "$50-100k", label: "$50,000 - $100,000" },
  { value: "$25-50k", label: "$25,000 - $50,000" },
  { value: "Under $25k", label: "Under $25,000" },
]

const NET_WORTH_OPTIONS = [
  { value: "", label: "Select your net worth range" },
  { value: "$2M+", label: "$2,000,000+" },
  { value: "$1-2M", label: "$1,000,000 - $2,000,000" },
  { value: "$500k-1M", label: "$500,000 - $1,000,000" },
  { value: "$250-500k", label: "$250,000 - $500,000" },
  { value: "$100-250k", label: "$100,000 - $250,000" },
  { value: "Under $100k", label: "Under $100,000" },
]

const FUNDING_PLAN_OPTIONS = [
  { value: "", label: "Select your funding plan" },
  { value: "Cash", label: "Cash" },
  { value: "SBA", label: "SBA Loan" },
  { value: "401(k) Rollover", label: "401(k) Rollover (ROBS)" },
  { value: "HELOC", label: "HELOC (Home Equity Line of Credit)" },
  { value: "Partner/Investors", label: "Partner or Investors" },
]

const YEARS_EXPERIENCE_OPTIONS = [
  { value: "0", label: "0 years (No business experience)" },
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "4", label: "4 years" },
  { value: "5", label: "5 years" },
  { value: "6-10", label: "6-10 years" },
  { value: "11-15", label: "11-15 years" },
  { value: "16-20", label: "16-20 years" },
  { value: "20+", label: "20+ years" },
]

export function ProfileSettings({ profile, onUpdateProfile }: ProfileSettingsProps) {
  const [editedProfile, setEditedProfile] = useState<BuyerProfile>(profile)
  const [isRunningCheck, setIsRunningCheck] = useState(false)
  const router = useRouter()

  // const [signupSource, setSignupSource] = useState<"fddadvisor" | "fddhub" | null>(null)

  // useEffect(() => {
  //   async function loadSignupSource() {
  //     const supabase = createBrowserClient()
  //     const { data } = await supabase.from("buyer_profiles").select("signup_source").eq("user_id", profile.id).single()

  //     if (data?.signup_source) {
  //       setSignupSource(data.signup_source as "fddadvisor" | "fddhub")
  //     }
  //   }
  //   loadSignupSource()
  // }, [profile.id])

  const handleSave = () => {
    onUpdateProfile(editedProfile)
  }

  const handleRunCreditCheck = async () => {
    setIsRunningCheck(true)
    try {
      const response = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_type: "fico",
          data: { score: 720 }, // Mock score for demo
        }),
      })

      if (!response.ok) throw new Error("Verification failed")

      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

      setEditedProfile({
        ...editedProfile,
        financialQualification: {
          ...editedProfile.financialQualification,
          creditScore: 720,
          creditVerifiedAt: now,
          creditExpiresAt: expiresAt,
          creditScoreVerified: true,
        },
      })

      // Refresh the page to update server state if needed
      router.refresh()
    } catch (error) {
      console.error("Credit check failed:", error)
    } finally {
      setIsRunningCheck(false)
    }
  }

  const handleVerifyWithPlaid = async () => {
    setIsRunningCheck(true)
    try {
      const response = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_type: "plaid",
          data: {
            liquid_capital: 150000,
            net_worth: 500000,
          },
        }),
      })

      if (!response.ok) throw new Error("Verification failed")

      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

      setEditedProfile({
        ...editedProfile,
        financialQualification: {
          ...editedProfile.financialQualification,
          liquidCapital: 150000,
          liquidCapitalVerifiedAt: now,
          liquidCapitalExpiresAt: expiresAt,
          liquidCapitalVerified: true,
        },
      })

      router.refresh()
    } catch (error) {
      console.error("Plaid verification failed:", error)
    } finally {
      setIsRunningCheck(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In real app, this would upload to Vercel Blob
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditedProfile({
          ...editedProfile,
          personalInfo: {
            ...editedProfile.personalInfo,
            profilePhotoUrl: reader.result as string,
          },
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const completionPercentage = () => {
    let completed = 0
    const total = 11 // Updated total to include new fields

    if (editedProfile.personalInfo.firstName) completed++
    if (editedProfile.personalInfo.email) completed++
    if (editedProfile.personalInfo.phone) completed++
    if (editedProfile.personalInfo.profilePhotoUrl) completed++
    if (editedProfile.businessExperience?.yearsOfExperience) completed++
    if (editedProfile.financialQualification.creditScore) completed++
    if (editedProfile.financialQualification.backgroundSelfReported) completed++
    if (editedProfile.financialQualification.liquidCapital) completed++
    if (editedProfile.financialQualification.totalInvestmentCapacity) completed++
    if (editedProfile.financialQualification.preApproval.status === "Approved") completed++
    if (editedProfile.businessExperience?.currentEmploymentStatus) completed++

    return Math.round((completed / total) * 100)
  }

  const calculateTotalCapacity = () => {
    const liquid = editedProfile.financialQualification.liquidCapital || 0
    const investments = editedProfile.financialQualification.totalInvestmentCapacity?.investmentsSelfReported || 0
    const homeEquity = editedProfile.financialQualification.totalInvestmentCapacity?.homeEquitySelfReported || 0
    const retirement = editedProfile.financialQualification.totalInvestmentCapacity?.retirementSelfReported || 0
    const other = editedProfile.financialQualification.totalInvestmentCapacity?.otherSelfReported || 0

    return liquid + investments + homeEquity + retirement + other
  }

  const showQualificationSections = true

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            Manage your personal information and financial qualifications
          </p>
        </div>
        <div className="hidden md:block">
          <Button onClick={handleSave} className="bg-cta hover:bg-cta/90 text-cta-foreground shadow-sm">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Personal Information Section */}
      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <User className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Personal Information</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your basic contact information</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-border shadow-md">
              <AvatarImage src={editedProfile.personalInfo.profilePhotoUrl || "/placeholder.svg"} />
              <AvatarFallback className="text-lg bg-muted">
                {editedProfile.personalInfo.firstName?.charAt(0)}
                {editedProfile.personalInfo.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" className="bg-background">
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size 2MB</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editedProfile.personalInfo.firstName}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, firstName: e.target.value },
                  })
                }
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editedProfile.personalInfo.lastName}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, lastName: e.target.value },
                  })
                }
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editedProfile.personalInfo.email}
                disabled
                className="h-11 bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={editedProfile.personalInfo.phone}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, phone: e.target.value },
                  })
                }
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, State"
              value={editedProfile.personalInfo.location}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  personalInfo: { ...editedProfile.personalInfo, location: e.target.value },
                })
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedInUrl" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn Profile URL
            </Label>
            <Input
              id="linkedInUrl"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={editedProfile.personalInfo.linkedInUrl || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  personalInfo: { ...editedProfile.personalInfo, linkedInUrl: e.target.value },
                })
              }
              className="h-11"
            />
          </div>
        </div>
      </Card>

      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <DollarSign className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Financial Qualification</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Help franchisors understand your financial readiness</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ficoScoreRange">FICO Score Range</Label>
              <Select
                value={editedProfile.financialQualification?.ficoScoreRange || ""}
                onValueChange={(value) =>
                  setEditedProfile({
                    ...editedProfile,
                    financialQualification: {
                      ...editedProfile.financialQualification,
                      ficoScoreRange: value,
                    },
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your FICO score range" />
                </SelectTrigger>
                <SelectContent>
                  {FICO_SCORE_OPTIONS.filter((opt) => opt.value).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liquidAssetsRange">Liquid Assets</Label>
              <Select
                value={editedProfile.financialQualification?.liquidAssetsRange || ""}
                onValueChange={(value) =>
                  setEditedProfile({
                    ...editedProfile,
                    financialQualification: {
                      ...editedProfile.financialQualification,
                      liquidAssetsRange: value,
                    },
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your liquid assets range" />
                </SelectTrigger>
                <SelectContent>
                  {LIQUID_ASSETS_OPTIONS.filter((opt) => opt.value).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="netWorthRange">Net Worth</Label>
              <Select
                value={editedProfile.financialQualification?.netWorthRange || ""}
                onValueChange={(value) =>
                  setEditedProfile({
                    ...editedProfile,
                    financialQualification: {
                      ...editedProfile.financialQualification,
                      netWorthRange: value,
                    },
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your net worth range" />
                </SelectTrigger>
                <SelectContent>
                  {NET_WORTH_OPTIONS.filter((opt) => opt.value).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingPlan">Funding Plan</Label>
              <Select
                value={editedProfile.financialQualification?.fundingPlan || ""}
                onValueChange={(value) =>
                  setEditedProfile({
                    ...editedProfile,
                    financialQualification: {
                      ...editedProfile.financialQualification,
                      fundingPlan: value,
                    },
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your funding plan" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_PLAN_OPTIONS.filter((opt) => opt.value).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Business Experience Section - Always shown */}
      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <Briefcase className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Business Experience</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Help franchisors understand your background</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Business Experience</Label>
              <Select
                value={String(editedProfile.businessExperience?.yearsOfExperience ?? "")}
                onValueChange={(value) =>
                  setEditedProfile({
                    ...editedProfile,
                    businessExperience: {
                      ...editedProfile.businessExperience,
                      yearsOfExperience: value === "20+" ? 20 : value.includes("-") ? parseInt(value.split("-")[0]) : parseInt(value) || 0,
                      industryExperience: editedProfile.businessExperience?.industryExperience || [],
                      hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                      managementExperience: editedProfile.businessExperience?.managementExperience || false,
                      currentEmploymentStatus:
                        editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                      relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                    },
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select years of experience" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_EXPERIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Current Employment Status</Label>
              <Select
                value={editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time"}
                onValueChange={(value) =>
                  setEditedProfile({
                    ...editedProfile,
                    businessExperience: {
                      ...editedProfile.businessExperience,
                      yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                      industryExperience: editedProfile.businessExperience?.industryExperience || [],
                      hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                      managementExperience: editedProfile.businessExperience?.managementExperience || false,
                      currentEmploymentStatus: value as BuyerProfile["businessExperience"]["currentEmploymentStatus"],
                      relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                    },
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed Full-Time">Employed Full-Time</SelectItem>
                  <SelectItem value="Employed Part-Time">Employed Part-Time</SelectItem>
                  <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            {" "}
            {/* Grouped checkboxes */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="hasOwnedBusiness"
                checked={editedProfile.businessExperience?.hasOwnedBusiness || false}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    businessExperience: {
                      ...editedProfile.businessExperience,
                      yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                      industryExperience: editedProfile.businessExperience?.industryExperience || [],
                      hasOwnedBusiness: checked as boolean,
                      managementExperience: editedProfile.businessExperience?.managementExperience || false,
                      currentEmploymentStatus:
                        editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                      relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="hasOwnedBusiness" className="font-medium cursor-pointer">
                  I have owned or operated a business before
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Previous business ownership demonstrates entrepreneurial experience
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="managementExperience"
                checked={editedProfile.businessExperience?.managementExperience || false}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    businessExperience: {
                      ...editedProfile.businessExperience,
                      yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                      industryExperience: editedProfile.businessExperience?.industryExperience || [],
                      hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                      managementExperience: checked as boolean,
                      currentEmploymentStatus:
                        editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                      relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="managementExperience" className="font-medium cursor-pointer">
                  I have management or leadership experience
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Managing teams and operations is valuable for franchise ownership
                </p>
              </div>
            </div>
          </div>

          {/* Veteran Status */}
          <div className="space-y-2">
            <Label htmlFor="veteranStatus">Are you a veteran?</Label>
            <Select
              value={editedProfile.isVeteran === true ? "yes" : editedProfile.isVeteran === false ? "no" : ""}
              onValueChange={(value) =>
                setEditedProfile({
                  ...editedProfile,
                  isVeteran: value === "yes" ? true : value === "no" ? false : null,
                })
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select yes or no" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Many franchisors offer special incentives and discounts for military veterans
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryExperience">Industry Experience (Optional)</Label>
            <Input
              id="industryExperience"
              placeholder="e.g., Retail, Healthcare, Technology (comma-separated)"
              value={editedProfile.businessExperience?.industryExperience?.join(", ") || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  businessExperience: {
                    ...editedProfile.businessExperience,
                    yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                    industryExperience: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                    managementExperience: editedProfile.businessExperience?.managementExperience || false,
                    currentEmploymentStatus:
                      editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                    relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                  },
                })
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relevantSkills">Relevant Skills (Optional)</Label>
            <Input
              id="relevantSkills"
              placeholder="e.g., Sales, Operations, Marketing, Finance (comma-separated)"
              value={editedProfile.businessExperience?.relevantSkills?.join(", ") || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  businessExperience: {
                    ...editedProfile.businessExperience,
                    yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                    industryExperience: editedProfile.businessExperience?.industryExperience || [],
                    hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                    managementExperience: editedProfile.businessExperience?.managementExperience || false,
                    currentEmploymentStatus:
                      editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                    relevantSkills: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
              className="h-11"
            />
          </div>
        </div>
      </Card>

      {/* Financial Qualifications Section - Always shown */}
      {showQualificationSections && (
        <Card className="p-8 border-border/60 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
            <div className="rounded-xl bg-cta/10 p-3">
              <DollarSign className="h-6 w-6 text-cta" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Financial Qualifications</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Required for franchisors to evaluate your qualification
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Credit Score Section */}
            <div className="p-5 bg-muted/20 rounded-xl border border-border/50">
              {" "}
              {/* Grouped verification sections */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base font-semibold">Credit Score (Soft Pull)</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Verify your credit score without impacting your credit
                  </p>
                </div>
                {editedProfile.financialQualification.creditScore && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cta">{editedProfile.financialQualification.creditScore}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires{" "}
                      {editedProfile.financialQualification.creditExpiresAt
                        ? new Date(editedProfile.financialQualification.creditExpiresAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                )}
              </div>
              {!editedProfile.financialQualification.creditScore ? (
                <Button
                  onClick={handleRunCreditCheck}
                  disabled={isRunningCheck}
                  className="w-full bg-background border-border/60 hover:bg-muted"
                >
                  {isRunningCheck ? "Running Check..." : "Run Soft Credit Check"}
                </Button>
              ) : (
                <Button
                  onClick={handleRunCreditCheck}
                  variant="outline"
                  disabled={isRunningCheck}
                  className="w-full bg-background border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isRunningCheck ? "Updating..." : "Verified - Click to Update"}
                </Button>
              )}
            </div>

            {/* Liquid Capital Section */}
            <div className="p-5 bg-muted/20 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base font-semibold">Liquid Capital</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Verify your available cash and liquid assets via Plaid
                  </p>
                </div>
                {editedProfile.financialQualification.liquidCapital && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cta">
                      ${editedProfile.financialQualification.liquidCapital.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires{" "}
                      {editedProfile.financialQualification.liquidCapitalExpiresAt
                        ? new Date(editedProfile.financialQualification.liquidCapitalExpiresAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                )}
              </div>
              {!editedProfile.financialQualification.liquidCapital ? (
                <Button
                  onClick={handleVerifyWithPlaid}
                  disabled={isRunningCheck}
                  className="w-full bg-background border-border/60 hover:bg-muted"
                >
                  {isRunningCheck ? "Connecting..." : "Verify with Plaid"}
                </Button>
              ) : (
                <Button
                  onClick={handleVerifyWithPlaid}
                  variant="outline"
                  disabled={isRunningCheck}
                  className="w-full bg-background border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isRunningCheck ? "Updating..." : "Verified - Click to Update"}
                </Button>
              )}
            </div>

            {/* Investment Capacity Section */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div>
                <Label className="text-base font-semibold">Total Investment Capacity (Self-Reported)</Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Include all sources of capital you can access for franchise investment
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="investments">Stocks/Investments</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                    <Input
                      id="investments"
                      type="number"
                      min="0"
                      placeholder="50000"
                      value={
                        editedProfile.financialQualification.totalInvestmentCapacity?.investmentsSelfReported || ""
                      }
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          financialQualification: {
                            ...editedProfile.financialQualification,
                            totalInvestmentCapacity: {
                              ...editedProfile.financialQualification.totalInvestmentCapacity,
                              investmentsSelfReported: Number.parseInt(e.target.value) || 0,
                              homeEquitySelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.homeEquitySelfReported ||
                                0,
                              retirementSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.retirementSelfReported ||
                                0,
                              otherSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.otherSelfReported || 0,
                            },
                          },
                        })
                      }
                      className="h-11 pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homeEquity">Home Equity</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                    <Input
                      id="homeEquity"
                      type="number"
                      min="0"
                      placeholder="100000"
                      value={editedProfile.financialQualification.totalInvestmentCapacity?.homeEquitySelfReported || ""}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          financialQualification: {
                            ...editedProfile.financialQualification,
                            totalInvestmentCapacity: {
                              ...editedProfile.financialQualification.totalInvestmentCapacity,
                              investmentsSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.investmentsSelfReported ||
                                0,
                              homeEquitySelfReported: Number.parseInt(e.target.value) || 0,
                              retirementSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.retirementSelfReported ||
                                0,
                              otherSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.otherSelfReported || 0,
                            },
                          },
                        })
                      }
                      className="h-11 pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retirement">Retirement Funds (401k, IRA)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                    <Input
                      id="retirement"
                      type="number"
                      min="0"
                      placeholder="75000"
                      value={editedProfile.financialQualification.totalInvestmentCapacity?.retirementSelfReported || ""}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          financialQualification: {
                            ...editedProfile.financialQualification,
                            totalInvestmentCapacity: {
                              ...editedProfile.financialQualification.totalInvestmentCapacity,
                              investmentsSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.investmentsSelfReported ||
                                0,
                              homeEquitySelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.homeEquitySelfReported ||
                                0,
                              retirementSelfReported: Number.parseInt(e.target.value) || 0,
                              otherSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.otherSelfReported || 0,
                            },
                          },
                        })
                      }
                      className="h-11 pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other">Other Sources</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                    <Input
                      id="other"
                      type="number"
                      min="0"
                      placeholder="25000"
                      value={editedProfile.financialQualification.totalInvestmentCapacity?.otherSelfReported || ""}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          financialQualification: {
                            ...editedProfile.financialQualification,
                            totalInvestmentCapacity: {
                              ...editedProfile.financialQualification.totalInvestmentCapacity,
                              investmentsSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.investmentsSelfReported ||
                                0,
                              homeEquitySelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.homeEquitySelfReported ||
                                0,
                              retirementSelfReported:
                                editedProfile.financialQualification.totalInvestmentCapacity?.retirementSelfReported ||
                                0,
                              otherSelfReported: Number.parseInt(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="h-11 pl-7"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-cta/5 rounded-xl border border-cta/10 mt-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total Investment Capacity:</span>
                  <span className="text-3xl font-bold text-cta">${calculateTotalCapacity().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Background Check Section */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div>
                <Label className="text-base font-semibold">Background Information (Self-Reported)</Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Franchisors may request formal verification later
                </p>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="noBankruptcy"
                    checked={editedProfile.financialQualification.backgroundSelfReported?.noBankruptcy || false}
                    onCheckedChange={(checked) =>
                      setEditedProfile({
                        ...editedProfile,
                        financialQualification: {
                          ...editedProfile.financialQualification,
                          backgroundSelfReported: {
                            ...editedProfile.financialQualification.backgroundSelfReported,
                            noBankruptcy: checked as boolean,
                            noFelonies:
                              editedProfile.financialQualification.backgroundSelfReported?.noFelonies || false,
                          },
                        },
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="noBankruptcy" className="font-medium cursor-pointer">
                      No bankruptcies in the past 7 years
                    </Label>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="noFelonies"
                    checked={editedProfile.financialQualification.backgroundSelfReported?.noFelonies || false}
                    onCheckedChange={(checked) =>
                      setEditedProfile({
                        ...editedProfile,
                        financialQualification: {
                          ...editedProfile.financialQualification,
                          backgroundSelfReported: {
                            ...editedProfile.financialQualification.backgroundSelfReported,
                            noBankruptcy:
                              editedProfile.financialQualification.backgroundSelfReported?.noBankruptcy || false,
                            noFelonies: checked as boolean,
                          },
                        },
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="noFelonies" className="font-medium cursor-pointer">
                      No felony convictions
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* My Documents Section - Only for FDDHub leads */}
      {showQualificationSections && (
        <Card className="p-8 border-border/60 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
            <div className="rounded-xl bg-cta/10 p-3">
              <FileCheck className="h-6 w-6 text-cta" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">My Documents</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Signed FDD receipts and legal documents</p>
            </div>
          </div>

          {fddEngagements.filter((e) => e.item23SignedAt).length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {fddEngagements
                .filter((e) => e.item23SignedAt)
                .map((engagement) => {
                  const franchise = franchises.find((f) => f.id === engagement.franchiseId)
                  if (!franchise) return null

                  return (
                    <Card
                      key={engagement.franchiseId}
                      className="p-6 border-border/50 hover:shadow-lg hover:border-emerald-300/50 transition-all duration-200 group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-emerald-50 p-2.5">
                            <FileCheck className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{franchise.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Item 23 Receipt</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Signed:</span>
                            <span className="font-medium text-foreground">
                              {new Date(engagement.item23SignedAt!).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Status:</span>
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs"
                            >
                              Signed
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-9 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => window.open(engagement.item23BuyerCopyUrl, "_blank")}
                        >
                          <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                          View My Receipt
                        </Button>
                      </div>
                    </Card>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
              <div className="rounded-full bg-muted/50 p-4 w-fit mx-auto mb-4">
                <FileCheck className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground">No signed documents yet</p>
              <p className="text-sm text-muted-foreground mt-1">When you sign FDD receipts, they'll appear here</p>
            </div>
          )}
        </Card>
      )}

      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <ShieldCheck className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Background Attestation</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Self-certify your background for franchisor review</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <Checkbox
                id="noFelonyAttestation"
                checked={editedProfile.backgroundAttestations?.noFelonyAttestation || false}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    backgroundAttestations: {
                      ...editedProfile.backgroundAttestations,
                      noFelonyAttestation: checked as boolean,
                      noBankruptcyAttestation: editedProfile.backgroundAttestations?.noBankruptcyAttestation || false,
                      attestedAt: new Date().toISOString(),
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="noFelonyAttestation" className="font-medium cursor-pointer">
                  I have not been convicted of a felony in the past 10 years
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This self-certification is required by most franchisors
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="noBankruptcyAttestation"
                checked={editedProfile.backgroundAttestations?.noBankruptcyAttestation || false}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    backgroundAttestations: {
                      ...editedProfile.backgroundAttestations,
                      noFelonyAttestation: editedProfile.backgroundAttestations?.noFelonyAttestation || false,
                      noBankruptcyAttestation: checked as boolean,
                      attestedAt: new Date().toISOString(),
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="noBankruptcyAttestation" className="font-medium cursor-pointer">
                  I have not filed for bankruptcy in the past 7 years
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This self-certification helps franchisors evaluate your financial stability
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Settings Section - Always shown */}
      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <Shield className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Privacy Settings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Control what information franchisors can see</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              When you connect with a franchisor, they will see the information you've selected below. Your financial
              verification status will always be visible to show you're a qualified buyer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
              <Checkbox
                id="shareContact"
                checked={editedProfile.privacySettings?.shareContactInfo ?? true}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    privacySettings: {
                      ...editedProfile.privacySettings,
                      shareContactInfo: checked as boolean,
                      shareFinancialDetails: editedProfile.privacySettings?.shareFinancialDetails ?? true,
                      shareBusinessExperience: editedProfile.privacySettings?.shareBusinessExperience ?? true,
                      shareEngagementData: editedProfile.privacySettings?.shareEngagementData ?? true,
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="shareContact" className="font-medium cursor-pointer text-base">
                  Share contact information
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">Email, phone, and location</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
              <Checkbox
                id="shareFinancial"
                checked={editedProfile.privacySettings?.shareFinancialDetails ?? true}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    privacySettings: {
                      ...editedProfile.privacySettings,
                      shareContactInfo: editedProfile.privacySettings?.shareContactInfo ?? true,
                      shareFinancialDetails: checked as boolean,
                      shareBusinessExperience: editedProfile.privacySettings?.shareBusinessExperience ?? true,
                      shareEngagementData: editedProfile.privacySettings?.shareEngagementData ?? true,
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="shareFinancial" className="font-medium cursor-pointer text-base">
                  Share financial details
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Credit score, liquid capital, and investment capacity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
              <Checkbox
                id="shareExperience"
                checked={editedProfile.privacySettings?.shareBusinessExperience ?? true}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    privacySettings: {
                      ...editedProfile.privacySettings,
                      shareContactInfo: editedProfile.privacySettings?.shareContactInfo ?? true,
                      shareFinancialDetails: editedProfile.privacySettings?.shareFinancialDetails ?? true,
                      shareBusinessExperience: checked as boolean,
                      shareEngagementData: editedProfile.privacySettings?.shareEngagementData ?? true,
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="shareExperience" className="font-medium cursor-pointer text-base">
                  Share business experience
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Years of experience, industry background, and skills
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border border-border/40 hover:bg-muted/40 transition-colors">
              <Checkbox
                id="shareEngagement"
                checked={editedProfile.privacySettings?.shareEngagementData ?? true}
                onCheckedChange={(checked) =>
                  setEditedProfile({
                    ...editedProfile,
                    privacySettings: {
                      ...editedProfile.privacySettings,
                      shareContactInfo: editedProfile.privacySettings?.shareContactInfo ?? true,
                      shareFinancialDetails: editedProfile.privacySettings?.shareFinancialDetails ?? true,
                      shareBusinessExperience: editedProfile.privacySettings?.shareBusinessExperience ?? true,
                      shareEngagementData: checked as boolean,
                    },
                  })
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="shareEngagement" className="font-medium cursor-pointer text-base">
                  Share engagement data
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Questions asked, time spent, and sections viewed in FDD
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Save Button */}
      <div className="md:hidden">
        <Button onClick={handleSave} className="w-full bg-cta hover:bg-cta/90 text-cta-foreground shadow-sm">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
