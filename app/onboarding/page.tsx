"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from "@/lib/supabase/client"
import { ChevronRight, ChevronLeft } from "lucide-react"

const INVESTMENT_RANGES = [
  { value: "50000-100000", label: "$50K - $100K", min: 50000, max: 100000 },
  { value: "100000-250000", label: "$100K - $250K", min: 100000, max: 250000 },
  { value: "250000-500000", label: "$250K - $500K", min: 250000, max: 500000 },
  { value: "500000-1000000", label: "$500K - $1M", min: 500000, max: 1000000 },
  { value: "1000000+", label: "$1M+", min: 1000000, max: null },
]

const INDUSTRIES = [
  "Food & Beverage",
  "Retail",
  "Health & Fitness",
  "Home Services",
  "Business Services",
  "Education",
  "Automotive",
  "Real Estate",
  "Technology",
  "Senior Care",
  "Pet Services",
  "Other",
]

const TIMELINES = [
  { value: "0-3", label: "Ready now (0-3 months)" },
  { value: "3-6", label: "Soon (3-6 months)" },
  { value: "6-12", label: "This year (6-12 months)" },
  { value: "12+", label: "Exploring (12+ months)" },
]

const OCCUPATIONS = [
  "Corporate Executive",
  "Sales/Marketing",
  "Healthcare Professional",
  "Technology/IT",
  "Finance/Accounting",
  "Education",
  "Military/Veteran",
  "Entrepreneur",
  "Retired",
  "Other",
]

const EXPERIENCE_LEVELS = [
  { value: "0-5", label: "0-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10-20", label: "10-20 years" },
  { value: "20+", label: "20+ years" },
]

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")

  const [investmentRange, setInvestmentRange] = useState("")
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [timeline, setTimeline] = useState("")
  const [occupation, setOccupation] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [hasFranchiseExp, setHasFranchiseExp] = useState<boolean | null>(null)
  const [preferredLocation, setPreferredLocation] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const totalSteps = 6
  const progress = (step / totalSteps) * 100

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry],
    )
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return investmentRange !== ""
      case 2:
        return selectedIndustries.length > 0
      case 3:
        return timeline !== ""
      case 4:
        return occupation !== ""
      case 5:
        return experienceYears !== "" && hasFranchiseExp !== null
      case 6:
        return city !== "" && state !== "" && zipCode !== ""
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      if (!userId) throw new Error("Not authenticated")

      const selectedRange = INVESTMENT_RANGES.find((r) => r.value === investmentRange)

      const { error: updateError } = await supabase
        .from("buyer_profiles")
        .update({
          investment_range_min: selectedRange?.min,
          investment_range_max: selectedRange?.max,
          industries_interested: selectedIndustries,
          buying_timeline: timeline,
          current_occupation: occupation,
          business_experience_years: experienceYears,
          has_franchise_experience: hasFranchiseExp,
          city_location: city,
          state_location: state,
          zip_code: zipCode,
          onboarding_completed: true,
        })
        .eq("user_id", userId)

      if (updateError) throw updateError

      router.push(returnUrl || "/discover")
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Onboarding error:", err)
      setError(err.message || "Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        setUserId(user.id)
      } catch (err) {
        console.error("[v0] Auth check error:", err)
        router.push("/login")
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </p>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && "What's your investment range?"}
            {step === 2 && "Which industries interest you?"}
            {step === 3 && "What's your timeline?"}
            {step === 4 && "What's your background?"}
            {step === 5 && "Tell us about your experience"}
            {step === 6 && "Where are you located?"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "This helps us show you franchises that match your budget"}
            {step === 2 && "Select all that apply - we'll personalize your recommendations"}
            {step === 3 && "When are you looking to open your franchise?"}
            {step === 4 && "Your professional background helps us understand your strengths"}
            {step === 5 && "This helps us match you with the right opportunities"}
            {step === 6 && "Many franchises have territorial restrictions based on location"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <RadioGroup value={investmentRange} onValueChange={setInvestmentRange}>
              <div className="space-y-3">
                {INVESTMENT_RANGES.map((range) => (
                  <div
                    key={range.value}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
                    onClick={() => setInvestmentRange(range.value)}
                  >
                    <RadioGroupItem value={range.value} id={range.value} />
                    <Label htmlFor={range.value} className="flex-1 cursor-pointer font-medium">
                      {range.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((industry) => (
                <div
                  key={industry}
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedIndustries.includes(industry) ? "bg-primary/10 border-primary" : "hover:bg-accent"
                  }`}
                  onClick={() => handleIndustryToggle(industry)}
                >
                  <Checkbox
                    id={industry}
                    checked={selectedIndustries.includes(industry)}
                    onCheckedChange={() => handleIndustryToggle(industry)}
                  />
                  <Label htmlFor={industry} className="flex-1 cursor-pointer font-medium text-sm">
                    {industry}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <RadioGroup value={timeline} onValueChange={setTimeline}>
              <div className="space-y-3">
                {TIMELINES.map((t) => (
                  <div
                    key={t.value}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
                    onClick={() => setTimeline(t.value)}
                  >
                    <RadioGroupItem value={t.value} id={t.value} />
                    <Label htmlFor={t.value} className="flex-1 cursor-pointer font-medium">
                      {t.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {step === 4 && (
            <RadioGroup value={occupation} onValueChange={setOccupation}>
              <div className="space-y-3">
                {OCCUPATIONS.map((occ) => (
                  <div
                    key={occ}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
                    onClick={() => setOccupation(occ)}
                  >
                    <RadioGroupItem value={occ} id={occ} />
                    <Label htmlFor={occ} className="flex-1 cursor-pointer font-medium">
                      {occ}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Years of business experience</Label>
                <RadioGroup value={experienceYears} onValueChange={setExperienceYears}>
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <div
                      key={exp.value}
                      className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
                      onClick={() => setExperienceYears(exp.value)}
                    >
                      <RadioGroupItem value={exp.value} id={exp.value} />
                      <Label htmlFor={exp.value} className="flex-1 cursor-pointer font-medium">
                        {exp.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Do you have franchise experience?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`flex items-center justify-center rounded-lg border p-4 cursor-pointer transition-colors ${
                      hasFranchiseExp === true ? "bg-primary/10 border-primary" : "hover:bg-accent"
                    }`}
                    onClick={() => setHasFranchiseExp(true)}
                  >
                    <Label className="cursor-pointer font-medium">Yes</Label>
                  </div>
                  <div
                    className={`flex items-center justify-center rounded-lg border p-4 cursor-pointer transition-colors ${
                      hasFranchiseExp === false ? "bg-primary/10 border-primary" : "hover:bg-accent"
                    }`}
                    onClick={() => setHasFranchiseExp(false)}
                  >
                    <Label className="cursor-pointer font-medium">No</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a state</option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <input
                  id="zipCode"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter your zip code"
                  maxLength={5}
                  pattern="[0-9]{5}"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={!canProceed() || loading}>
                {loading ? "Saving..." : "Complete"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
