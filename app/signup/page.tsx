"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { signupUser } from "@/app/actions/signup"

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
  "Other",
]

const TIMELINES = [
  { value: "0-3", label: "0-3 months" },
  { value: "3-6", label: "3-6 months" },
  { value: "6-12", label: "6-12 months" },
  { value: "12+", label: "12+ months" },
]

export default function SignupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get("redirect")

  // Basic info
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"buyer" | "franchisor" | "lender">("buyer")
  const [companyName, setCompanyName] = useState("")

  const [investmentMin, setInvestmentMin] = useState("")
  const [investmentMax, setInvestmentMax] = useState("")
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [timeline, setTimeline] = useState("")
  const [occupation, setOccupation] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [hasFranchiseExp, setHasFranchiseExp] = useState(false)
  const [preferredLocation, setPreferredLocation] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // Multi-step form for buyers

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Starting signup process...")
      console.log("[v0] Role:", role)
      console.log("[v0] Email:", email)
      console.log("[v0] Company Name:", companyName)

      const result = await signupUser({
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        company_name: companyName,
      })

      if (!result.success) {
        console.error("[v0] Signup failed:", result.error)
        throw new Error(result.error)
      }

      console.log("[v0] User created successfully")

      if (role === "buyer" && result.user) {
        console.log("[v0] Buyer profile created, additional fields can be updated later")
      }

      console.log("[v0] Redirecting to login...")
      router.push(`/login?email=${encodeURIComponent(email)}&message=Account created successfully! Please sign in.`)
    } catch (err: any) {
      console.error("[v0] Signup error:", err)
      const errorMessage = err.message || "Failed to create account"
      console.error("[v0] Error message:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry],
    )
  }

  const canProceedToStep2 = email && password && firstName && lastName && phone
  const canSubmit = role !== "buyer" || (timeline && selectedIndustries.length > 0)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {role === "buyer"
              ? "Tell us about yourself to get personalized franchise recommendations"
              : "Get started with FDDHub"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Step 1: Basic Info & Role Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>I am a...</Label>
                <RadioGroup value={role} onValueChange={(value: any) => setRole(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="font-normal">
                      Buyer (researching franchises)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="franchisor" id="franchisor" />
                    <Label htmlFor="franchisor" className="font-normal">
                      Franchisor (selling franchises)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lender" id="lender" />
                    <Label htmlFor="lender" className="font-normal">
                      Lender (financing franchises)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {(role === "franchisor" || role === "lender") && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{role === "buyer" ? "First Name" : "First Name"}</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{role === "buyer" ? "Last Name" : "Last Name"}</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {role === "buyer" && step === 1 && canProceedToStep2 && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Tell us about your franchise goals</h3>
                  <p className="text-sm text-muted-foreground">
                    This helps us provide better recommendations and insights
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="investmentMin">Min Investment</Label>
                    <Input
                      id="investmentMin"
                      type="number"
                      placeholder="50000"
                      value={investmentMin}
                      onChange={(e) => setInvestmentMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investmentMax">Max Investment</Label>
                    <Input
                      id="investmentMax"
                      type="number"
                      placeholder="250000"
                      value={investmentMax}
                      onChange={(e) => setInvestmentMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Industries of Interest *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map((industry) => (
                      <div key={industry} className="flex items-center space-x-2">
                        <Checkbox
                          id={industry}
                          checked={selectedIndustries.includes(industry)}
                          onCheckedChange={() => handleIndustryToggle(industry)}
                        />
                        <Label htmlFor={industry} className="font-normal text-sm">
                          {industry}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Buying Timeline *</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Current Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g., Sales Manager"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Business Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    placeholder="10"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasFranchiseExp"
                    checked={hasFranchiseExp}
                    onCheckedChange={(checked) => setHasFranchiseExp(checked as boolean)}
                  />
                  <Label htmlFor="hasFranchiseExp" className="font-normal">
                    I have previous franchise experience
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredLocation">Preferred Location</Label>
                  <Input
                    id="preferredLocation"
                    placeholder="e.g., California, Texas"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              View demo
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
