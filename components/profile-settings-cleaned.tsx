"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, DollarSign, Briefcase, Linkedin, ShieldCheck, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { BuyerProfile } from "@/lib/data"

interface ProfileSettingsProps {
  profile: BuyerProfile
  onUpdateProfile: (profile: BuyerProfile) => void
}

const FICO_SCORE_OPTIONS = [
  { value: "780+", label: "780+ (Excellent)" },
  { value: "720-779", label: "720-779 (Very Good)" },
  { value: "680-719", label: "680-719 (Good)" },
  { value: "620-679", label: "620-679 (Fair)" },
  { value: "580-619", label: "580-619 (Poor)" },
  { value: "Under 580", label: "Under 580 (Very Poor)" },
]

const LIQUID_ASSETS_OPTIONS = [
  { value: "$500k+", label: "$500,000+" },
  { value: "$250-500k", label: "$250,000 - $500,000" },
  { value: "$100-250k", label: "$100,000 - $250,000" },
  { value: "$50-100k", label: "$50,000 - $100,000" },
  { value: "$25-50k", label: "$25,000 - $50,000" },
  { value: "Under $25k", label: "Under $25,000" },
]

const NET_WORTH_OPTIONS = [
  { value: "$2M+", label: "$2,000,000+" },
  { value: "$1-2M", label: "$1,000,000 - $2,000,000" },
  { value: "$500k-1M", label: "$500,000 - $1,000,000" },
  { value: "$250-500k", label: "$250,000 - $500,000" },
  { value: "$100-250k", label: "$100,000 - $250,000" },
  { value: "Under $100k", label: "Under $100,000" },
]

const FUNDING_PLAN_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "SBA Loan", label: "SBA Loan" },
  { value: "401k Rollover", label: "401(k) Rollover (ROBS)" },
  { value: "HELOC", label: "HELOC (Home Equity Line of Credit)" },
  { value: "Partner/Investors", label: "Partner or Investors" },
]

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

export function ProfileSettings({ profile, onUpdateProfile }: ProfileSettingsProps) {
  const [editedProfile, setEditedProfile] = useState<BuyerProfile>(profile)
  const [selectedFundingPlans, setSelectedFundingPlans] = useState<string[]>(
    profile.financialQualification?.fundingPlans || []
  )
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Local string state for comma-separated inputs (prevents comma from being stripped while typing)
  const [industryExperienceText, setIndustryExperienceText] = useState<string>(
    profile.businessExperience?.industryExperience?.join(", ") || ""
  )
  const [relevantSkillsText, setRelevantSkillsText] = useState<string>(
    profile.businessExperience?.relevantSkills?.join(", ") || ""
  )

  // Parse comma-separated text into array (used on blur)
  const parseCommaSeparated = (text: string): string[] => {
    return text.split(",").map(s => s.trim()).filter(Boolean)
  }

  // Update profile with parsed industry experience
  const handleIndustryExperienceBlur = () => {
    const parsed = parseCommaSeparated(industryExperienceText)
    setEditedProfile({
      ...editedProfile,
      businessExperience: {
        ...editedProfile.businessExperience,
        yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
        industryExperience: parsed,
        hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
        managementExperience: editedProfile.businessExperience?.managementExperience || false,
        currentEmploymentStatus: editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
        relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
      },
    })
  }

  // Update profile with parsed relevant skills
  const handleRelevantSkillsBlur = () => {
    const parsed = parseCommaSeparated(relevantSkillsText)
    setEditedProfile({
      ...editedProfile,
      businessExperience: {
        ...editedProfile.businessExperience,
        yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
        industryExperience: editedProfile.businessExperience?.industryExperience || [],
        hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
        managementExperience: editedProfile.businessExperience?.managementExperience || false,
        currentEmploymentStatus: editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
        relevantSkills: parsed,
      },
    })
  }

  // Sync local text state when profile prop changes
  useEffect(() => {
    setIndustryExperienceText(profile.businessExperience?.industryExperience?.join(", ") || "")
    setRelevantSkillsText(profile.businessExperience?.relevantSkills?.join(", ") || "")
  }, [profile])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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

  const toggleFundingPlan = (plan: string) => {
    const newPlans = selectedFundingPlans.includes(plan)
      ? selectedFundingPlans.filter(p => p !== plan)
      : [...selectedFundingPlans, plan]
    
    setSelectedFundingPlans(newPlans)
    setEditedProfile({
      ...editedProfile,
      financialQualification: {
        ...editedProfile.financialQualification,
        fundingPlans: newPlans,
      },
    })
  }

  const validateRequiredFields = (): boolean => {
    const errors: Record<string, string> = {}

    // Personal Info - Required
    if (!editedProfile.personalInfo.firstName?.trim()) {
      errors.firstName = "First name is required"
    }
    if (!editedProfile.personalInfo.lastName?.trim()) {
      errors.lastName = "Last name is required"
    }
    if (!editedProfile.personalInfo.phone?.trim()) {
      errors.phone = "Phone number is required"
    }
    if (!editedProfile.personalInfo.city?.trim()) {
      errors.city = "City is required"
    }
    if (!editedProfile.personalInfo.state?.trim()) {
      errors.state = "State is required"
    }
    if (!editedProfile.personalInfo.desiredTerritories?.trim()) {
      errors.desiredTerritories = "Desired territories is required"
    }

    // Business Experience - Required
    if (!editedProfile.businessExperience?.yearsOfExperience || editedProfile.businessExperience.yearsOfExperience < 0) {
      errors.yearsOfExperience = "Years of experience is required"
    }
    if (!editedProfile.businessExperience?.currentEmploymentStatus) {
      errors.currentEmploymentStatus = "Employment status is required"
    }

    // Financial Qualification - Required
    if (!editedProfile.financialQualification?.ficoScoreRange) {
      errors.ficoScoreRange = "FICO score range is required"
    }
    if (!editedProfile.financialQualification?.liquidAssetsRange) {
      errors.liquidAssetsRange = "Liquid assets range is required"
    }
    if (!editedProfile.financialQualification?.netWorthRange) {
      errors.netWorthRange = "Net worth range is required"
    }
    if (!selectedFundingPlans.length) {
      errors.fundingPlans = "Select at least one funding plan"
    }

    // Background Attestation - Required (must have answered, not just be true)
    if (editedProfile.backgroundAttestations?.noBankruptcyAttestation === undefined || 
        editedProfile.backgroundAttestations?.noBankruptcyAttestation === null) {
      errors.noBankruptcyAttestation = "Please answer this question"
    }
    if (editedProfile.backgroundAttestations?.noFelonyAttestation === undefined ||
        editedProfile.backgroundAttestations?.noFelonyAttestation === null) {
      errors.noFelonyAttestation = "Please answer this question"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (validateRequiredFields()) {
      // Ensure comma-separated text inputs are parsed before saving
      const profileToSave: BuyerProfile = {
        ...editedProfile,
        businessExperience: {
          ...editedProfile.businessExperience,
          yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
          industryExperience: parseCommaSeparated(industryExperienceText),
          hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
          managementExperience: editedProfile.businessExperience?.managementExperience || false,
          currentEmploymentStatus: editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
          relevantSkills: parseCommaSeparated(relevantSkillsText),
        },
      }
      onUpdateProfile(profileToSave)
    } else {
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-error="true"]')
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Check if profile is complete WITHOUT setting state (safe to call during render)
  const isProfileComplete = () => {
    if (!editedProfile.personalInfo.firstName?.trim()) return false
    if (!editedProfile.personalInfo.lastName?.trim()) return false
    if (!editedProfile.personalInfo.phone?.trim()) return false
    if (!editedProfile.personalInfo.city?.trim()) return false
    if (!editedProfile.personalInfo.state?.trim()) return false
    if (!editedProfile.personalInfo.desiredTerritories?.trim()) return false
    if (!editedProfile.businessExperience?.yearsOfExperience || editedProfile.businessExperience.yearsOfExperience < 0) return false
    if (!editedProfile.businessExperience?.currentEmploymentStatus) return false
    if (!editedProfile.financialQualification?.ficoScoreRange) return false
    if (!editedProfile.financialQualification?.liquidAssetsRange) return false
    if (!editedProfile.financialQualification?.netWorthRange) return false
    if (!selectedFundingPlans.length) return false
    if (editedProfile.backgroundAttestations?.noBankruptcyAttestation === undefined ||
        editedProfile.backgroundAttestations?.noBankruptcyAttestation === null) return false
    if (editedProfile.backgroundAttestations?.noFelonyAttestation === undefined ||
        editedProfile.backgroundAttestations?.noFelonyAttestation === null) return false
    return true
  }

  const completionPercentage = () => {
    let completed = 0
    const total = 13 // Total required fields

    if (editedProfile.personalInfo.firstName) completed++
    if (editedProfile.personalInfo.lastName) completed++
    if (editedProfile.personalInfo.phone) completed++
    if (editedProfile.personalInfo.city) completed++
    if (editedProfile.personalInfo.state) completed++
    if (editedProfile.personalInfo.desiredTerritories) completed++
    if (editedProfile.businessExperience?.yearsOfExperience) completed++
    if (editedProfile.businessExperience?.currentEmploymentStatus) completed++
    if (editedProfile.financialQualification?.ficoScoreRange) completed++
    if (editedProfile.financialQualification?.liquidAssetsRange) completed++
    if (editedProfile.financialQualification?.netWorthRange) completed++
    if (selectedFundingPlans.length > 0) completed++
    if (editedProfile.backgroundAttestations?.noBankruptcyAttestation !== undefined && 
        editedProfile.backgroundAttestations?.noBankruptcyAttestation !== null &&
        editedProfile.backgroundAttestations?.noFelonyAttestation !== undefined &&
        editedProfile.backgroundAttestations?.noFelonyAttestation !== null) completed++

    return Math.round((completed / total) * 100)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            Complete your profile to access franchise opportunities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{completionPercentage()}%</span> complete
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!isProfileComplete()}
            className="bg-cta hover:bg-cta/90 text-cta-foreground shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Completion Alert */}
      {completionPercentage() < 100 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Complete your profile to access FDDs
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              All required fields must be completed. Optional fields (like LinkedIn and industry experience) help franchisors better understand your qualifications.
            </p>
          </div>
        </div>
      )}

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
              <input
                type="file"
                id="photoUpload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-background"
                onClick={() => document.getElementById('photoUpload')?.click()}
              >
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size 2MB</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2" data-error={!!validationErrors.firstName}>
              <Label htmlFor="firstName" className="flex items-center gap-1">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={editedProfile.personalInfo.firstName}
                onChange={(e) => {
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, firstName: e.target.value },
                  })
                  setValidationErrors({ ...validationErrors, firstName: "" })
                }}
                className={`h-11 ${validationErrors.firstName ? 'border-destructive' : ''}`}
              />
              {validationErrors.firstName && (
                <p className="text-sm text-destructive">{validationErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2" data-error={!!validationErrors.lastName}>
              <Label htmlFor="lastName" className="flex items-center gap-1">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={editedProfile.personalInfo.lastName}
                onChange={(e) => {
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, lastName: e.target.value },
                  })
                  setValidationErrors({ ...validationErrors, lastName: "" })
                }}
                className={`h-11 ${validationErrors.lastName ? 'border-destructive' : ''}`}
              />
              {validationErrors.lastName && (
                <p className="text-sm text-destructive">{validationErrors.lastName}</p>
              )}
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
            <div className="space-y-2" data-error={!!validationErrors.phone}>
              <Label htmlFor="phone" className="flex items-center gap-1">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={editedProfile.personalInfo.phone}
                onChange={(e) => {
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, phone: e.target.value },
                  })
                  setValidationErrors({ ...validationErrors, phone: "" })
                }}
                className={`h-11 ${validationErrors.phone ? 'border-destructive' : ''}`}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2" data-error={!!validationErrors.city}>
              <Label htmlFor="city" className="flex items-center gap-1">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                placeholder="San Antonio"
                value={editedProfile.personalInfo.city || ""}
                onChange={(e) => {
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, city: e.target.value },
                  })
                  setValidationErrors({ ...validationErrors, city: "" })
                }}
                className={`h-11 ${validationErrors.city ? 'border-destructive' : ''}`}
              />
              {validationErrors.city && (
                <p className="text-sm text-destructive">{validationErrors.city}</p>
              )}
            </div>
            <div className="space-y-2" data-error={!!validationErrors.state}>
              <Label htmlFor="state" className="flex items-center gap-1">
                State <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editedProfile.personalInfo.state || ""}
                onValueChange={(value) => {
                  setEditedProfile({
                    ...editedProfile,
                    personalInfo: { ...editedProfile.personalInfo, state: value },
                  })
                  setValidationErrors({ ...validationErrors, state: "" })
                }}
              >
                <SelectTrigger className={`h-11 ${validationErrors.state ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.state && (
                <p className="text-sm text-destructive">{validationErrors.state}</p>
              )}
            </div>
          </div>

          <div className="space-y-2" data-error={!!validationErrors.desiredTerritories}>
            <Label htmlFor="desiredTerritories" className="flex items-center gap-1">
              Desired Territories <span className="text-destructive">*</span>
            </Label>
            <Input
              id="desiredTerritories"
              placeholder="e.g., San Antonio, Austin, Dallas or Texas or Southwest US"
              value={editedProfile.personalInfo.desiredTerritories || ""}
              onChange={(e) => {
                setEditedProfile({
                  ...editedProfile,
                  personalInfo: { ...editedProfile.personalInfo, desiredTerritories: e.target.value },
                })
                setValidationErrors({ ...validationErrors, desiredTerritories: "" })
              }}
              className={`h-11 ${validationErrors.desiredTerritories ? 'border-destructive' : ''}`}
            />
            {validationErrors.desiredTerritories && (
              <p className="text-sm text-destructive">{validationErrors.desiredTerritories}</p>
            )}
            <p className="text-sm text-muted-foreground">
              List cities, regions, or states where you're interested in opening a franchise
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedInUrl" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn Profile URL <span className="text-muted-foreground text-sm">(Optional)</span>
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
            <p className="text-sm text-muted-foreground">
              Adding your LinkedIn helps franchisors understand your professional background
            </p>
          </div>
        </div>
      </Card>

      {/* Business Experience Section */}
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
            <div className="space-y-2" data-error={!!validationErrors.yearsOfExperience}>
              <Label htmlFor="yearsExperience" className="flex items-center gap-1">
                Years of Business Experience <span className="text-destructive">*</span>
              </Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                placeholder="10"
                value={editedProfile.businessExperience?.yearsOfExperience || ""}
                onChange={(e) => {
                  setEditedProfile({
                    ...editedProfile,
                    businessExperience: {
                      ...editedProfile.businessExperience,
                      yearsOfExperience: Number.parseInt(e.target.value) || 0,
                      industryExperience: editedProfile.businessExperience?.industryExperience || [],
                      hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                      managementExperience: editedProfile.businessExperience?.managementExperience || false,
                      currentEmploymentStatus:
                        editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                      relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                    },
                  })
                  setValidationErrors({ ...validationErrors, yearsOfExperience: "" })
                }}
                className={`h-11 ${validationErrors.yearsOfExperience ? 'border-destructive' : ''}`}
              />
              {validationErrors.yearsOfExperience && (
                <p className="text-sm text-destructive">{validationErrors.yearsOfExperience}</p>
              )}
            </div>

            <div className="space-y-2" data-error={!!validationErrors.currentEmploymentStatus}>
              <Label htmlFor="employmentStatus" className="flex items-center gap-1">
                Current Employment Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editedProfile.businessExperience?.currentEmploymentStatus || ""}
                onValueChange={(value) => {
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
                  setValidationErrors({ ...validationErrors, currentEmploymentStatus: "" })
                }}
              >
                <SelectTrigger className={`h-11 ${validationErrors.currentEmploymentStatus ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed Full-Time">Employed Full-Time</SelectItem>
                  <SelectItem value="Employed Part-Time">Employed Part-Time</SelectItem>
                  <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.currentEmploymentStatus && (
                <p className="text-sm text-destructive">{validationErrors.currentEmploymentStatus}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-3">
              <Label className="font-medium">Have you owned or operated a business before?</Label>
              <p className="text-sm text-muted-foreground">Previous business ownership demonstrates entrepreneurial experience</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="hasOwnedBusinessYes"
                    name="hasOwnedBusiness"
                    checked={editedProfile.businessExperience?.hasOwnedBusiness === true}
                    onChange={() =>
                      setEditedProfile({
                        ...editedProfile,
                        businessExperience: {
                          ...editedProfile.businessExperience,
                          yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                          industryExperience: editedProfile.businessExperience?.industryExperience || [],
                          hasOwnedBusiness: true,
                          managementExperience: editedProfile.businessExperience?.managementExperience || false,
                          currentEmploymentStatus:
                            editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                          relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                        },
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="hasOwnedBusinessYes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="hasOwnedBusinessNo"
                    name="hasOwnedBusiness"
                    checked={editedProfile.businessExperience?.hasOwnedBusiness === false}
                    onChange={() =>
                      setEditedProfile({
                        ...editedProfile,
                        businessExperience: {
                          ...editedProfile.businessExperience,
                          yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                          industryExperience: editedProfile.businessExperience?.industryExperience || [],
                          hasOwnedBusiness: false,
                          managementExperience: editedProfile.businessExperience?.managementExperience || false,
                          currentEmploymentStatus:
                            editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                          relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                        },
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="hasOwnedBusinessNo" className="cursor-pointer">No</Label>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="font-medium">Do you have management or leadership experience?</Label>
              <p className="text-sm text-muted-foreground">Managing teams and operations is valuable for franchise ownership</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="managementExperienceYes"
                    name="managementExperience"
                    checked={editedProfile.businessExperience?.managementExperience === true}
                    onChange={() =>
                      setEditedProfile({
                        ...editedProfile,
                        businessExperience: {
                          ...editedProfile.businessExperience,
                          yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                          industryExperience: editedProfile.businessExperience?.industryExperience || [],
                          hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                          managementExperience: true,
                          currentEmploymentStatus:
                            editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                          relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                        },
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="managementExperienceYes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="managementExperienceNo"
                    name="managementExperience"
                    checked={editedProfile.businessExperience?.managementExperience === false}
                    onChange={() =>
                      setEditedProfile({
                        ...editedProfile,
                        businessExperience: {
                          ...editedProfile.businessExperience,
                          yearsOfExperience: editedProfile.businessExperience?.yearsOfExperience || 0,
                          industryExperience: editedProfile.businessExperience?.industryExperience || [],
                          hasOwnedBusiness: editedProfile.businessExperience?.hasOwnedBusiness || false,
                          managementExperience: false,
                          currentEmploymentStatus:
                            editedProfile.businessExperience?.currentEmploymentStatus || "Employed Full-Time",
                          relevantSkills: editedProfile.businessExperience?.relevantSkills || [],
                        },
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="managementExperienceNo" className="cursor-pointer">No</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryExperience">
              Industry Experience <span className="text-muted-foreground text-sm">(Optional - Recommended)</span>
            </Label>
            <Input
              id="industryExperience"
              placeholder="e.g., Retail, Healthcare, Technology (comma-separated)"
              value={industryExperienceText}
              onChange={(e) => setIndustryExperienceText(e.target.value)}
              onBlur={handleIndustryExperienceBlur}
              className="h-11"
            />
            <p className="text-sm text-muted-foreground">
              Matching industry experience significantly improves your consideration by franchisors
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relevantSkills">
              Relevant Skills <span className="text-muted-foreground text-sm">(Optional - Recommended)</span>
            </Label>
            <Input
              id="relevantSkills"
              placeholder="e.g., Sales, Operations, Marketing, Finance (comma-separated)"
              value={relevantSkillsText}
              onChange={(e) => setRelevantSkillsText(e.target.value)}
              onBlur={handleRelevantSkillsBlur}
              className="h-11"
            />
            <p className="text-sm text-muted-foreground">
              Skills like sales, operations, and leadership help franchisors assess your fit
            </p>
          </div>
        </div>
      </Card>

      {/* Financial Qualification Section */}
      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <DollarSign className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Financial Qualification</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Self-reported financial information (franchisors may verify later)
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2" data-error={!!validationErrors.ficoScoreRange}>
              <Label htmlFor="ficoScoreRange" className="flex items-center gap-1">
                FICO Score Range <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editedProfile.financialQualification?.ficoScoreRange || ""}
                onValueChange={(value) => {
                  setEditedProfile({
                    ...editedProfile,
                    financialQualification: {
                      ...editedProfile.financialQualification,
                      ficoScoreRange: value,
                    },
                  })
                  setValidationErrors({ ...validationErrors, ficoScoreRange: "" })
                }}
              >
                <SelectTrigger className={`h-11 ${validationErrors.ficoScoreRange ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select your FICO score range" />
                </SelectTrigger>
                <SelectContent>
                  {FICO_SCORE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.ficoScoreRange && (
                <p className="text-sm text-destructive">{validationErrors.ficoScoreRange}</p>
              )}
            </div>

            <div className="space-y-2" data-error={!!validationErrors.liquidAssetsRange}>
              <Label htmlFor="liquidAssetsRange" className="flex items-center gap-1">
                Liquid Assets <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editedProfile.financialQualification?.liquidAssetsRange || ""}
                onValueChange={(value) => {
                  setEditedProfile({
                    ...editedProfile,
                    financialQualification: {
                      ...editedProfile.financialQualification,
                      liquidAssetsRange: value,
                    },
                  })
                  setValidationErrors({ ...validationErrors, liquidAssetsRange: "" })
                }}
              >
                <SelectTrigger className={`h-11 ${validationErrors.liquidAssetsRange ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select your liquid assets range" />
                </SelectTrigger>
                <SelectContent>
                  {LIQUID_ASSETS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.liquidAssetsRange && (
                <p className="text-sm text-destructive">{validationErrors.liquidAssetsRange}</p>
              )}
            </div>
          </div>

          <div className="space-y-2" data-error={!!validationErrors.netWorthRange}>
            <Label htmlFor="netWorthRange" className="flex items-center gap-1">
              Net Worth <span className="text-destructive">*</span>
            </Label>
            <Select
              value={editedProfile.financialQualification?.netWorthRange || ""}
              onValueChange={(value) => {
                setEditedProfile({
                  ...editedProfile,
                  financialQualification: {
                    ...editedProfile.financialQualification,
                    netWorthRange: value,
                  },
                })
                setValidationErrors({ ...validationErrors, netWorthRange: "" })
              }}
            >
              <SelectTrigger className={`h-11 ${validationErrors.netWorthRange ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select your net worth range" />
              </SelectTrigger>
              <SelectContent>
                {NET_WORTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.netWorthRange && (
              <p className="text-sm text-destructive">{validationErrors.netWorthRange}</p>
            )}
          </div>

          <div className="space-y-3" data-error={!!validationErrors.fundingPlans}>
            <Label className="flex items-center gap-1">
              Funding Plan <span className="text-destructive">*</span>
              <span className="text-muted-foreground text-sm ml-1">(Select all that apply)</span>
            </Label>
            <div className="grid gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              {FUNDING_PLAN_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start gap-3">
                  <Checkbox
                    id={`funding-${option.value}`}
                    checked={selectedFundingPlans.includes(option.value)}
                    onCheckedChange={() => {
                      toggleFundingPlan(option.value)
                      setValidationErrors({ ...validationErrors, fundingPlans: "" })
                    }}
                    className="mt-1"
                  />
                  <Label htmlFor={`funding-${option.value}`} className="font-medium cursor-pointer flex-1">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {validationErrors.fundingPlans && (
              <p className="text-sm text-destructive">{validationErrors.fundingPlans}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Background Attestation Section */}
      <Card className="p-8 border-border/60 shadow-sm">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="rounded-xl bg-cta/10 p-3">
            <ShieldCheck className="h-6 w-6 text-cta" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Background Attestation</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Self-certify your background (franchisors may verify later)
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 p-4 bg-muted/30 rounded-lg border border-border/50" 
               data-error={!!validationErrors.noBankruptcyAttestation || !!validationErrors.noFelonyAttestation}>
            <div className="space-y-3">
              <Label className="font-medium flex items-center gap-1">
                Have you filed for bankruptcy in the past 7 years? <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">This helps franchisors evaluate your financial stability</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="bankruptcyYes"
                    name="bankruptcy"
                    checked={editedProfile.backgroundAttestations?.noBankruptcyAttestation === false}
                    onChange={() => {
                      setEditedProfile({
                        ...editedProfile,
                        backgroundAttestations: {
                          ...editedProfile.backgroundAttestations,
                          noBankruptcyAttestation: false,
                          noFelonyAttestation: editedProfile.backgroundAttestations?.noFelonyAttestation ?? null,
                          attestedAt: new Date().toISOString(),
                        },
                      })
                      setValidationErrors({ ...validationErrors, noBankruptcyAttestation: "" })
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="bankruptcyYes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="bankruptcyNo"
                    name="bankruptcy"
                    checked={editedProfile.backgroundAttestations?.noBankruptcyAttestation === true}
                    onChange={() => {
                      setEditedProfile({
                        ...editedProfile,
                        backgroundAttestations: {
                          ...editedProfile.backgroundAttestations,
                          noBankruptcyAttestation: true,
                          noFelonyAttestation: editedProfile.backgroundAttestations?.noFelonyAttestation ?? null,
                          attestedAt: new Date().toISOString(),
                        },
                      })
                      setValidationErrors({ ...validationErrors, noBankruptcyAttestation: "" })
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="bankruptcyNo" className="cursor-pointer">No</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-medium flex items-center gap-1">
                Have you been convicted of a felony in the past 10 years? <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">This information is required by most franchisors</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="felonyYes"
                    name="felony"
                    checked={editedProfile.backgroundAttestations?.noFelonyAttestation === false}
                    onChange={() => {
                      setEditedProfile({
                        ...editedProfile,
                        backgroundAttestations: {
                          ...editedProfile.backgroundAttestations,
                          noFelonyAttestation: false,
                          noBankruptcyAttestation: editedProfile.backgroundAttestations?.noBankruptcyAttestation ?? null,
                          attestedAt: new Date().toISOString(),
                        },
                      })
                      setValidationErrors({ ...validationErrors, noFelonyAttestation: "" })
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="felonyYes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="felonyNo"
                    name="felony"
                    checked={editedProfile.backgroundAttestations?.noFelonyAttestation === true}
                    onChange={() => {
                      setEditedProfile({
                        ...editedProfile,
                        backgroundAttestations: {
                          ...editedProfile.backgroundAttestations,
                          noFelonyAttestation: true,
                          noBankruptcyAttestation: editedProfile.backgroundAttestations?.noBankruptcyAttestation ?? null,
                          attestedAt: new Date().toISOString(),
                        },
                      })
                      setValidationErrors({ ...validationErrors, noFelonyAttestation: "" })
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="felonyNo" className="cursor-pointer">No</Label>
                </div>
              </div>
            </div>

            {(validationErrors.noBankruptcyAttestation || validationErrors.noFelonyAttestation) && (
              <p className="text-sm text-destructive">Please answer both questions</p>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Save Button */}
      <div className="md:hidden">
        <Button 
          onClick={handleSave} 
          disabled={!isProfileComplete()}
          className="w-full bg-cta hover:bg-cta/90 text-cta-foreground shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}
