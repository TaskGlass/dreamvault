"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Bell, User, Shield, Sparkles, Loader2, Check, Plus, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfile, updateUserProfile } from "@/lib/dream-service"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useProfile } from "@/hooks/use-profile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPortal } from "react-dom"

type UserProfile = {
  user_id: string;
  full_name?: string;
  subscription_tier?: string;
  dreams_count?: number;
  dreams_limit?: number;
  created_at?: string;
  avatar_url?: string;
  birthday?: string;
  timezone?: string;
  [key: string]: any;
};

function isValidProfile(obj: any): obj is UserProfile {
  return obj && typeof obj === 'object' && 'user_id' in obj;
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { profile: contextProfile, refreshProfile } = useProfile()
  const [mounted, setMounted] = useState(false)

  // Form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [timezone, setTimezone] = useState("Pacific Time (UTC-8)")
  const [birthYear, setBirthYear] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")

  // Generate arrays for select options
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString())
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const getDaysInMonth = (year: string, month: string) => {
    return new Date(parseInt(year), parseInt(month), 0).getDate()
  }
  const days = birthYear && birthMonth 
    ? Array.from({ length: getDaysInMonth(birthYear, birthMonth) }, (_, i) => (i + 1).toString().padStart(2, '0'))
    : Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [savedCards, setSavedCards] = useState<any[]>([])

  // Plan change state
  const [changingPlan, setChangingPlan] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!fullName) return "DV"
    const nameParts = fullName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    }
    return nameParts[0].substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      try {
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)

        // Use the type predicate for the type guard
        if (isValidProfile(userProfile)) {
          setFullName(userProfile.full_name || user.user_metadata?.full_name || "")
          setEmail(user.email || "")
          setTimezone(userProfile.timezone || "Pacific Time (UTC-8)")
          
          // Parse birthday if it exists
          if (userProfile.birthday) {
            const [year, month, day] = userProfile.birthday.split('-')
            setBirthYear(year)
            setBirthMonth(month)
            setBirthDay(day)
          }

          // Mock saved cards for demo purposes
          if (userProfile.subscription_tier !== "free") {
            setSavedCards([
              {
                id: "card_1",
                last4: "4242",
                brand: "Visa",
                expMonth: "12",
                expYear: "25",
                isDefault: true,
              },
            ])
          }
        } else {
          setFullName(user.user_metadata?.full_name || "")
          setEmail(user.email || "")
          setTimezone("Pacific Time (UTC-8)")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load your profile information.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, toast])

  useEffect(() => setMounted(true), [])

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Format birthday
      const birthday = birthYear && birthMonth && birthDay 
        ? new Date(`${birthYear}-${birthMonth}-${birthDay}`).toISOString().split('T')[0]
        : null

      // Log the data being sent
      console.log("Attempting to save profile with:", {
        user_id: user.id,
        full_name: fullName,
        birthday,
        timezone
      })

      // Check if profile exists
      const existingProfile = await getUserProfile(user.id)
      console.log("Fetched user profile:", existingProfile)
      
      if (!existingProfile) {
        // Create new profile if it doesn't exist
        const { error: createError } = await supabase.from("profiles").insert({
          user_id: user.id,
          full_name: fullName,
          birthday: birthday,
          timezone: timezone,
          subscription_tier: "free",
          dreams_count: 0,
          dreams_limit: 5,
          created_at: new Date().toISOString(),
        })
        if (createError) {
          console.error("Error creating profile:", createError, JSON.stringify(createError))
          throw createError
        }
      } else {
        // Update existing profile
        const { success, error } = await updateUserProfile(user.id, {
          full_name: fullName,
          birthday: birthday,
          timezone: timezone
        })
        console.log("updateUserProfile result:", { success, error })
        if (!success) {
          console.error("Error updating profile:", error, JSON.stringify(error))
          throw error
        }
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })
      if (updateError) {
        console.error("Error updating user metadata:", updateError, JSON.stringify(updateError))
        throw updateError
      }

      // Update local state
      setProfile({ ...profile, full_name: fullName, birthday, timezone })
      if (refreshProfile) {
        await refreshProfile()
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      })
    } catch (error) {
      console.error("Error saving profile:", error, JSON.stringify(error))
      toast({
        title: "Error",
        description: "Failed to save your profile information.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      toast({
        title: "Missing information",
        description: "Please fill in all payment details.",
        variant: "destructive",
      })
      return
    }

    setProcessingPayment(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add the new card to the saved cards
      const newCard = {
        id: `card_${Date.now()}`,
        last4: cardNumber.slice(-4),
        brand: getCardBrand(cardNumber),
        expMonth: expiryDate.split("/")[0],
        expYear: expiryDate.split("/")[1],
        isDefault: savedCards.length === 0,
      }

      setSavedCards([...savedCards, newCard])

      // Reset form
      setCardNumber("")
      setCardName("")
      setExpiryDate("")
      setCvv("")
      setShowPaymentForm(false)

      toast({
        title: "Payment method added",
        description: "Your payment method has been saved successfully.",
      })
    } catch (error) {
      console.error("Error adding payment method:", error)
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const getCardBrand = (number: string) => {
    const firstDigit = number.charAt(0)
    if (firstDigit === "4") return "Visa"
    if (firstDigit === "5") return "Mastercard"
    if (firstDigit === "3") return "Amex"
    if (firstDigit === "6") return "Discover"
    return "Card"
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return v
  }

  const handleRemoveCard = (cardId: string) => {
    setSavedCards(savedCards.filter((card) => card.id !== cardId))

    toast({
      title: "Payment method removed",
      description: "Your payment method has been removed successfully.",
    })
  }

  const handleSetDefaultCard = (cardId: string) => {
    setSavedCards(
      savedCards.map((card) => ({
        ...card,
        isDefault: card.id === cardId,
      })),
    )

    toast({
      title: "Default payment method updated",
      description: "Your default payment method has been updated.",
    })
  }

  const handleChangePlan = async (newTier: string) => {
    if (!user) return

    setChangingPlan(true)
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          newTier,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to change plan")
      }

      const data = await response.json()
      
      // Update local state
      setProfile({ ...profile, subscription_tier: newTier })
      if (refreshProfile) {
        await refreshProfile()
      }

      toast({
        title: "Plan updated",
        description: `Your plan has been updated to ${newTier === "pro" ? "Astral Voyager" : newTier === "starter" ? "Lucid Explorer" : "Dreamer Lite"}`,
      })
    } catch (error) {
      console.error("Error changing plan:", error)
      toast({
        title: "Error",
        description: "Failed to change plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChangingPlan(false)
      setShowPlanModal(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user) return

    setChangingPlan(true)
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          newTier: "free",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }

      const data = await response.json()
      
      // Update local state
      setProfile({ ...profile, subscription_tier: "free" })
      if (refreshProfile) {
        await refreshProfile()
      }

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled. You will continue to have access to your current plan until the end of your billing period.",
      })
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChangingPlan(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full space-y-6 pb-8 sm:pb-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Consistent width container for all tabs */}
          <div className="w-full">
            <TabsContent value="profile" className="space-y-6 w-full">
              <div className="min-h-[800px] w-full">
                <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-500" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16 border-2 border-purple-300/20">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xl">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{fullName || "DreamVault User"}</div>
                        <div className="text-sm text-muted-foreground">{email}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} disabled className="bg-muted/50" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={birthYear} onValueChange={setBirthYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={birthMonth} onValueChange={setBirthMonth}>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month} value={month}>
                                {new Date(2000, parseInt(month) - 1).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={birthDay} onValueChange={setBirthDay}>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">Required for horoscope features</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option>Pacific Time (UTC-8)</option>
                        <option>Mountain Time (UTC-7)</option>
                        <option>Central Time (UTC-6)</option>
                        <option>Eastern Time (UTC-5)</option>
                      </select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Security
                    </CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Update Password</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6 w-full">
              <div className="min-h-[800px] w-full">
                <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Current Plan
                      </CardTitle>
                      <Badge
                        className={`bg-gradient-to-r ${
                          profile?.subscription_tier === "pro"
                            ? "from-indigo-500 to-blue-500"
                            : profile?.subscription_tier === "starter"
                              ? "from-purple-500 to-indigo-500"
                              : "from-gray-500 to-gray-600"
                        }`}
                      >
                        {profile?.subscription_tier === "pro"
                          ? "Astral Voyager"
                          : profile?.subscription_tier === "starter"
                            ? "Lucid Explorer"
                            : "Dreamer Lite"}
                      </Badge>
                    </div>
                    <CardDescription>Your subscription details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">
                          {profile?.subscription_tier === "pro"
                            ? "Astral Voyager"
                            : profile?.subscription_tier === "starter"
                              ? "Lucid Explorer"
                              : "Dreamer Lite"}
                        </div>
                        <div className="font-bold">
                          {profile?.subscription_tier === "pro"
                            ? "$19/month"
                            : profile?.subscription_tier === "starter"
                              ? "$9/month"
                              : "Free"}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        {profile?.subscription_tier !== "free"
                          ? "Billed monthly. Renews on June 5, 2025"
                          : "Free plan with limited features"}
                      </div>
                      <ul className="space-y-2 text-sm">
                        {profile?.subscription_tier === "free" && (
                          <>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> 5 dreams per month
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Basic text interpretation
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Save dreams
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> 72h email support
                            </li>
                          </>
                        )}

                        {profile?.subscription_tier === "starter" && (
                          <>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> 15 dreams per month
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Mood & emotion insights
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Personalized affirmations
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Daily horoscope integration
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> 24h support
                            </li>
                          </>
                        )}

                        {profile?.subscription_tier === "pro" && (
                          <>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> 30 dreams per month
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Advanced horoscope analysis
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Weekly dream summaries
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Shareable reports
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> All Starter features
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500" /> Priority support
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      {profile?.subscription_tier !== "pro" && (
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowPlanModal(true)}
                          disabled={changingPlan}
                        >
                          {changingPlan ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Change Plan"
                          )}
                        </Button>
                      )}
                      {profile?.subscription_tier !== "free" && (
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={handleCancelSubscription}
                          disabled={changingPlan}
                        >
                          {changingPlan ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Cancel Subscription"
                          )}
                        </Button>
                      )}
                    </div>

                    {mounted && showPlanModal && createPortal(
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl border border-purple-300/20 animate-in slide-in-from-bottom-4 duration-300 relative my-8 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">Choose Your Plan</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowPlanModal(false)}
                              className="hover:bg-purple-100/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {profile?.subscription_tier !== "starter" && (
                              <div 
                                className="border rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 group"
                                onClick={() => handleChangePlan("starter")}
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <div>
                                    <div className="font-medium text-lg group-hover:text-purple-500 transition-colors">Lucid Explorer</div>
                                    <div className="text-sm text-muted-foreground">Perfect for dream enthusiasts</div>
                                  </div>
                                  <div className="font-bold text-lg">$9<span className="text-sm text-muted-foreground">/month</span></div>
                                </div>
                                <ul className="text-sm space-y-2">
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> 15 dreams per month
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Mood & emotion insights
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Personalized affirmations
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Daily horoscope integration
                                  </li>
                                </ul>
                              </div>
                            )}
                            {profile?.subscription_tier !== "pro" && (
                              <div 
                                className="border rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 group bg-gradient-to-br from-purple-500/5 to-indigo-500/5"
                                onClick={() => handleChangePlan("pro")}
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <div>
                                    <div className="font-medium text-lg group-hover:text-purple-500 transition-colors">Astral Voyager</div>
                                    <div className="text-sm text-muted-foreground">For serious dream explorers</div>
                                  </div>
                                  <div className="font-bold text-lg">$19<span className="text-sm text-muted-foreground">/month</span></div>
                                </div>
                                <ul className="text-sm space-y-2">
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> 30 dreams per month
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Advanced horoscope analysis
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Weekly dream summaries
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Shareable reports
                                  </li>
                                  <li className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500" /> Priority support
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="mt-6 flex justify-end sticky bottom-0 bg-background pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => setShowPlanModal(false)}
                              className="hover:bg-purple-100/10"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription>Manage your payment details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {savedCards.length > 0 ? (
                      <div className="space-y-4">
                        {savedCards.map((card) => (
                          <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="rounded-md bg-background p-2 border">
                                <CreditCard className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {card.brand} •••• {card.last4}
                                  {card.isDefault && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Expires {card.expMonth}/{card.expYear}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!card.isDefault && (
                                <Button variant="outline" size="sm" onClick={() => handleSetDefaultCard(card.id)}>
                                  Set Default
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveCard(card.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No payment methods on file</p>
                        <p className="text-sm mt-2">Add a payment method to upgrade your plan</p>
                      </div>
                    )}

                    {showPaymentForm ? (
                      <div className="mt-6 border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-4">Add Payment Method</h3>
                        <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input
                              id="card-number"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              maxLength={19}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card-name">Cardholder Name</Label>
                            <Input
                              id="card-name"
                              placeholder="John Doe"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input
                                id="expiry"
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                maxLength={5}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                                maxLength={4}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={processingPayment}>
                              {processingPayment ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Save Card"
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <Button onClick={() => setShowPaymentForm(true)} className="w-full mt-4" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 w-full">
              <div className="min-h-[800px] w-full">
                <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-purple-500" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Dream Reminders</div>
                        <div className="text-sm text-muted-foreground">Receive reminders to record your dreams</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Weekly Insights</div>
                        <div className="text-sm text-muted-foreground">Get a weekly summary of your dream patterns</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">New Features</div>
                        <div className="text-sm text-muted-foreground">Be notified about new app features</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Marketing Emails</div>
                        <div className="text-sm text-muted-foreground">Receive promotional offers and updates</div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 w-full">
              <div className="min-h-[800px] w-full">
                <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Privacy Settings
                    </CardTitle>
                    <CardDescription>Control how your data is used</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">Data Collection</div>
                        <div className="text-sm text-muted-foreground">
                          Allow us to collect anonymous usage data to improve the app
                        </div>
                      </div>
                      <Switch defaultChecked className="mt-1 shrink-0" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">Dream Data for Research</div>
                        <div className="text-sm text-muted-foreground">
                          Allow anonymized dream data to be used for research
                        </div>
                      </div>
                      <Switch className="mt-1 shrink-0" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">Public Profile</div>
                        <div className="text-sm text-muted-foreground">Make your profile visible to other users</div>
                      </div>
                      <Switch className="mt-1 shrink-0" />
                    </div>

                    <div className="mt-6">
                      <Button variant="destructive">Delete Account</Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        This will permanently delete your account and all associated data.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}
