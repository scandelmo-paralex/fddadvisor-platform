"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Save, 
  Loader2, 
  Video, 
  UserCheck, 
  BarChart3,
  AlertCircle,
  Check,
  DollarSign,
  Briefcase,
  Users,
  Target
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_TEMPERATURE_THRESHOLDS,
  DEFAULT_IDEAL_CANDIDATE_CONFIG,
  SCORING_PRESETS,
  AVAILABLE_SKILLS,
  type ScoringWeights,
  type TemperatureThresholds,
  type IdealCandidateConfig
} from "@/lib/lead-scoring"

// =============================================================================
// TYPES
// =============================================================================

interface WhiteLabelSettingsProps {
  franchiseId: string
  franchiseName: string
  onClose?: () => void
}

interface SettingsState {
  // Resources tab
  resources_video_url: string
  resources_video_title: string
  resources_video_description: string
  // Ideal Candidate tab
  ideal_candidate_config: IdealCandidateConfig
  // Lead Scoring tab
  scoring_weights: ScoringWeights
  temperature_thresholds: TemperatureThresholds
}

// Available industries for multi-select
const AVAILABLE_INDUSTRIES = [
  "Retail",
  "Hospitality",
  "Salon/Spa/Beauty",
  "Fitness/Wellness",
  "Food Service",
  "Healthcare",
  "Professional Services",
  "Real Estate",
  "Automotive",
  "Education",
  "Home Services",
  "Senior Care",
  "Pet Services",
  "Cleaning Services",
  "Other"
]

// Years of experience options
const EXPERIENCE_OPTIONS = [
  { value: "none", label: "No minimum" },
  { value: "1+", label: "1+ years" },
  { value: "3+", label: "3+ years" },
  { value: "5+", label: "5+ years" },
  { value: "10+", label: "10+ years" },
]

// Liquid capital options  
const LIQUID_CAPITAL_OPTIONS = [
  { value: "none", label: "No minimum" },
  { value: 50000, label: "$50,000" },
  { value: 75000, label: "$75,000" },
  { value: 100000, label: "$100,000" },
  { value: 150000, label: "$150,000" },
  { value: 200000, label: "$200,000" },
  { value: 250000, label: "$250,000" },
  { value: 300000, label: "$300,000" },
  { value: 400000, label: "$400,000" },
  { value: 500000, label: "$500,000" },
  { value: 750000, label: "$750,000" },
  { value: 1000000, label: "$1,000,000" },
  { value: 1500000, label: "$1,500,000" },
  { value: 2000000, label: "$2,000,000+" },
]

// Net worth options
const NET_WORTH_OPTIONS = [
  { value: "none", label: "No minimum" },
  { value: 100000, label: "$100,000" },
  { value: 200000, label: "$200,000" },
  { value: 300000, label: "$300,000" },
  { value: 500000, label: "$500,000" },
  { value: 750000, label: "$750,000" },
  { value: 1000000, label: "$1,000,000" },
  { value: 1500000, label: "$1,500,000" },
  { value: 2000000, label: "$2,000,000" },
  { value: 3000000, label: "$3,000,000" },
  { value: 5000000, label: "$5,000,000+" },
]

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function WeightInput({ 
  label, 
  value, 
  onChange, 
  icon: Icon,
  description 
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  icon: React.ElementType
  description: string
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-20 text-center"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </div>
  )
}

function IndustryCheckbox({
  industry,
  checked,
  onChange
}: {
  industry: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
      />
      <span className="text-sm">{industry}</span>
    </label>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhiteLabelSettings({ franchiseId, franchiseName, onClose }: WhiteLabelSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("resources")
  const [settings, setSettings] = useState<SettingsState>({
    resources_video_url: "",
    resources_video_title: "",
    resources_video_description: "",
    ideal_candidate_config: DEFAULT_IDEAL_CANDIDATE_CONFIG,
    scoring_weights: DEFAULT_SCORING_WEIGHTS,
    temperature_thresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
  })

  // Calculate weight sum for validation
  const weightSum = settings.scoring_weights.base + 
                    settings.scoring_weights.engagement + 
                    settings.scoring_weights.financial + 
                    settings.scoring_weights.experience
  const weightsValid = weightSum === 100

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [franchiseId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/white-label-settings/${franchiseId}`)
      if (response.ok) {
        const data = await response.json()
        if (data && data.franchise_id) {
          setSettings({
            resources_video_url: data.resources_video_url || "",
            resources_video_title: data.resources_video_title || "",
            resources_video_description: data.resources_video_description || "",
            ideal_candidate_config: data.ideal_candidate_config || DEFAULT_IDEAL_CANDIDATE_CONFIG,
            scoring_weights: data.scoring_weights || DEFAULT_SCORING_WEIGHTS,
            temperature_thresholds: data.temperature_thresholds || DEFAULT_TEMPERATURE_THRESHOLDS,
          })
        }
      }
    } catch (error) {
      console.error("[WhiteLabelSettings] Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate weights before saving
    if (!weightsValid) {
      alert("Scoring weights must sum to 100%. Please adjust the weights.")
      return
    }

    // Validate thresholds
    if (settings.temperature_thresholds.hot <= settings.temperature_thresholds.warm) {
      alert("Hot threshold must be greater than Warm threshold.")
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/white-label-settings/${franchiseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      alert("Settings saved successfully!")
      onClose?.()
    } catch (error) {
      console.error("[WhiteLabelSettings] Failed to save:", error)
      alert(error instanceof Error ? error.message : "Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Scoring weight update handler
  const updateWeight = useCallback((key: keyof ScoringWeights, value: number) => {
    setSettings(prev => ({
      ...prev,
      scoring_weights: {
        ...prev.scoring_weights,
        [key]: value
      }
    }))
  }, [])

  // Threshold update handler
  const updateThreshold = useCallback((key: keyof TemperatureThresholds, value: number) => {
    setSettings(prev => ({
      ...prev,
      temperature_thresholds: {
        ...prev.temperature_thresholds,
        [key]: value
      }
    }))
  }, [])

  // Ideal candidate update handlers
  const updateFinancialRequirement = useCallback((key: string, value: number | null) => {
    setSettings(prev => ({
      ...prev,
      ideal_candidate_config: {
        ...prev.ideal_candidate_config,
        financial_requirements: {
          ...prev.ideal_candidate_config.financial_requirements,
          [key]: value
        }
      }
    }))
  }, [])

  const updateExperienceRequirement = useCallback((key: string, value: boolean | string | null) => {
    setSettings(prev => ({
      ...prev,
      ideal_candidate_config: {
        ...prev.ideal_candidate_config,
        experience_requirements: {
          ...prev.ideal_candidate_config.experience_requirements,
          [key]: value
        }
      }
    }))
  }, [])

  const toggleIndustry = useCallback((industry: string, checked: boolean) => {
    setSettings(prev => {
      const currentIndustries = prev.ideal_candidate_config.preferred_industries || []
      const newIndustries = checked
        ? [...currentIndustries, industry]
        : currentIndustries.filter(i => i !== industry)
      
      return {
        ...prev,
        ideal_candidate_config: {
          ...prev.ideal_candidate_config,
          preferred_industries: newIndustries
        }
      }
    })
  }, [])

  const toggleSkill = useCallback((skill: string, checked: boolean) => {
    setSettings(prev => {
      const currentSkills = prev.ideal_candidate_config.preferred_skills || []
      const newSkills = checked
        ? [...currentSkills, skill]
        : currentSkills.filter(s => s !== skill)
      
      return {
        ...prev,
        ideal_candidate_config: {
          ...prev.ideal_candidate_config,
          preferred_skills: newSkills
        }
      }
    })
  }, [])

  const updateOwnershipModel = useCallback((value: 'owner_operator' | 'semi_absentee' | 'either') => {
    setSettings(prev => ({
      ...prev,
      ideal_candidate_config: {
        ...prev.ideal_candidate_config,
        ownership_model: value
      }
    }))
  }, [])

  const updateDisqualifier = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      ideal_candidate_config: {
        ...prev.ideal_candidate_config,
        disqualifiers: {
          ...prev.ideal_candidate_config.disqualifiers,
          [key]: value
        }
      }
    }))
  }, [])

  // Apply preset configuration
  const applyPreset = useCallback((presetKey: keyof typeof SCORING_PRESETS) => {
    const preset = SCORING_PRESETS[presetKey]
    setSettings(prev => ({
      ...prev,
      scoring_weights: preset.weights,
      temperature_thresholds: preset.thresholds
    }))
  }, [])

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading settings...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resources" className="gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="ideal-candidate" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Ideal Candidate</span>
          </TabsTrigger>
          <TabsTrigger value="lead-scoring" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Lead Scoring</span>
          </TabsTrigger>
        </TabsList>

        {/* ================================================================== */}
        {/* RESOURCES TAB */}
        {/* ================================================================== */}
        <TabsContent value="resources" className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Video className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Resources Tab Video</h3>
              <p className="text-sm text-muted-foreground">
                Customize the featured video shown to leads in the Resources tab
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>YouTube Video URL</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
                value={settings.resources_video_url}
                onChange={(e) => setSettings({ ...settings, resources_video_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube URL. Leave blank to use the default FDD guide video.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Video Title</Label>
              <Input
                placeholder="Welcome to Our Franchise"
                value={settings.resources_video_title}
                onChange={(e) => setSettings({ ...settings, resources_video_title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Video Description</Label>
              <Textarea
                placeholder="Learn about our franchise opportunity..."
                value={settings.resources_video_description}
                onChange={(e) => setSettings({ ...settings, resources_video_description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </TabsContent>

        {/* ================================================================== */}
        {/* IDEAL CANDIDATE TAB */}
        {/* ================================================================== */}
        <TabsContent value="ideal-candidate" className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="rounded-lg bg-green-500/10 p-2">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Ideal Candidate Profile</h3>
              <p className="text-sm text-muted-foreground">
                Define what makes your perfect franchisee. These criteria help score and qualify leads.
              </p>
            </div>
          </div>

          {/* Financial Requirements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h4 className="font-medium">Financial Requirements</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Liquid Capital</Label>
                <Select
                  value={settings.ideal_candidate_config.financial_requirements.liquid_capital_min?.toString() || "none"}
                  onValueChange={(v) => updateFinancialRequirement('liquid_capital_min', v && v !== "none" ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select minimum..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LIQUID_CAPITAL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value.toString()} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum Net Worth</Label>
                <Select
                  value={settings.ideal_candidate_config.financial_requirements.net_worth_min?.toString() || "none"}
                  onValueChange={(v) => updateFinancialRequirement('net_worth_min', v && v !== "none" ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select minimum..." />
                  </SelectTrigger>
                  <SelectContent>
                    {NET_WORTH_OPTIONS.map(opt => (
                      <SelectItem key={opt.value.toString()} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Experience Requirements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">Experience Preferences</h4>
            </div>

            <div className="space-y-3 pl-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.ideal_candidate_config.experience_requirements.management_experience_required}
                  onCheckedChange={(checked) => 
                    updateExperienceRequirement('management_experience_required', !!checked)
                  }
                />
                <span className="text-sm">Management experience required</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.ideal_candidate_config.experience_requirements.business_ownership_preferred}
                  onCheckedChange={(checked) => 
                    updateExperienceRequirement('business_ownership_preferred', !!checked)
                  }
                />
                <span className="text-sm">Prior business ownership preferred</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.ideal_candidate_config.experience_requirements.franchise_experience_required}
                  onCheckedChange={(checked) => 
                    updateExperienceRequirement('franchise_experience_required', !!checked)
                  }
                />
                <span className="text-sm">Franchise experience required</span>
              </label>
            </div>

            <div className="space-y-2 max-w-xs">
              <Label>Minimum Years of Experience</Label>
              <Select
                value={settings.ideal_candidate_config.experience_requirements.min_years_experience || "none"}
                onValueChange={(v) => updateExperienceRequirement('min_years_experience', v && v !== "none" ? v : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferred Industries */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium">Preferred Industries</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Select industries where candidates with experience are preferred
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_INDUSTRIES.map(industry => (
                <IndustryCheckbox
                  key={industry}
                  industry={industry}
                  checked={settings.ideal_candidate_config.preferred_industries?.includes(industry) || false}
                  onChange={(checked) => toggleIndustry(industry, checked)}
                />
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <h4 className="font-medium">Preferred Skills</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Select skills that are important for your ideal franchisee. AI will match these against the candidate's self-reported skills and experience.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg bg-muted/20">
              {AVAILABLE_SKILLS.map(skill => (
                <label key={skill} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.ideal_candidate_config.preferred_skills?.includes(skill) || false}
                    onCheckedChange={(checked) => toggleSkill(skill, !!checked)}
                  />
                  <span className="text-sm">{skill}</span>
                </label>
              ))}
            </div>
            
            {(settings.ideal_candidate_config.preferred_skills?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {settings.ideal_candidate_config.preferred_skills?.map(skill => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill, false)}
                      className="hover:text-indigo-900 dark:hover:text-indigo-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ownership Model */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <h4 className="font-medium">Ownership Model</h4>
            </div>
            
            <div className="space-y-2">
              <Select
                value={settings.ideal_candidate_config.ownership_model}
                onValueChange={(v: 'owner_operator' | 'semi_absentee' | 'either') => updateOwnershipModel(v)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner_operator">Owner-Operator Only</SelectItem>
                  <SelectItem value="semi_absentee">Semi-Absentee Acceptable</SelectItem>
                  <SelectItem value="either">Either Model Welcome</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Disqualifiers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium">Disqualifiers</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Require these attestations from candidates
            </p>

            <div className="space-y-3 pl-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.ideal_candidate_config.disqualifiers.require_felony_attestation}
                  onCheckedChange={(checked) => 
                    updateDisqualifier('require_felony_attestation', !!checked)
                  }
                />
                <span className="text-sm">Must pass felony attestation</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={settings.ideal_candidate_config.disqualifiers.require_bankruptcy_attestation}
                  onCheckedChange={(checked) => 
                    updateDisqualifier('require_bankruptcy_attestation', !!checked)
                  }
                />
                <span className="text-sm">Must pass bankruptcy attestation</span>
              </label>
            </div>
          </div>
        </TabsContent>

        {/* ================================================================== */}
        {/* LEAD SCORING TAB */}
        {/* ================================================================== */}
        <TabsContent value="lead-scoring" className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Scoring Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Customize how lead quality scores are calculated and classified
              </p>
            </div>
          </div>

          {/* Scoring Weights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Scoring Weights</h4>
              <div className="flex items-center gap-2">
                {weightsValid ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Total: {weightSum}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Total: {weightSum}% (must be 100%)
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Adjust how different factors contribute to lead quality scores. Weights must total 100%.
            </p>

            <div className="space-y-3">
              <WeightInput
                label="Base Score"
                description="Points for being a verified lead"
                value={settings.scoring_weights.base}
                onChange={(v) => updateWeight('base', v)}
                icon={Check}
              />
              <WeightInput
                label="Engagement"
                description="FDD viewing time and activity"
                value={settings.scoring_weights.engagement}
                onChange={(v) => updateWeight('engagement', v)}
                icon={BarChart3}
              />
              <WeightInput
                label="Financial"
                description="Meeting financial requirements"
                value={settings.scoring_weights.financial}
                onChange={(v) => updateWeight('financial', v)}
                icon={DollarSign}
              />
              <WeightInput
                label="Experience"
                description="Background and skills match"
                value={settings.scoring_weights.experience}
                onChange={(v) => updateWeight('experience', v)}
                icon={Briefcase}
              />
            </div>

            {/* Preset buttons */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Quick presets:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SCORING_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(key as keyof typeof SCORING_PRESETS)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Temperature Thresholds */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Temperature Thresholds</h4>
            <p className="text-xs text-muted-foreground">
              Define what score qualifies as Hot, Warm, or Cold
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔥</span>
                  <Label className="text-red-700 dark:text-red-400 font-medium">Hot Lead</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Score ≥</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.temperature_thresholds.hot}
                    onChange={(e) => updateThreshold('hot', parseInt(e.target.value) || 80)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prioritize immediate follow-up
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🟡</span>
                  <Label className="text-yellow-700 dark:text-yellow-400 font-medium">Warm Lead</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Score ≥</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.temperature_thresholds.warm}
                    onChange={(e) => updateThreshold('warm', parseInt(e.target.value) || 60)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ready for engagement
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <span className="text-lg">❄️</span>
                <Label className="text-blue-700 dark:text-blue-400 font-medium">Cold Lead</Label>
                <span className="text-sm text-muted-foreground ml-2">
                  Score &lt; {settings.temperature_thresholds.warm} points
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Needs nurturing and education
              </p>
            </div>

            {settings.temperature_thresholds.hot <= settings.temperature_thresholds.warm && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Hot threshold must be greater than Warm threshold
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t mt-6">
        <Button 
          onClick={handleSave} 
          disabled={saving || !weightsValid} 
          className="bg-cta hover:bg-cta/90 text-cta-foreground gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
