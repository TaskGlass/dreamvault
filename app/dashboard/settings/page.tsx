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
import { CreditCard, Bell, User, Shield, Sparkles, Upload, Loader2, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfile } from "@/lib/dream-service"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [timezone, setTimezone] = useState("Pacific Time (UTC-8)")

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

        // Initialize form values
        setFullName(userProfile?.full_name || user.user_metadata?.full_name || "")
        setEmail(user.email || "")
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

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update profile in database
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id)

      if (error) throw error

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })

      if (updateError) throw updateError

      // Update local state
      setProfile({ ...profile, full_name: fullName })

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save your profile information.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPEG, PNG, etc.).",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploadingAvatar(true)
    try {
      // Upload to Supabase Storage
      const fileName = `avatar-${user.id}-${Date.now()}`
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) throw error

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path)

      const avatarUrl = publicUrlData.publicUrl

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      // Update user metadata
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      })

      if (userUpdateError) throw userUpdateError

      // Update local state
      setProfile({ ...profile, avatar_url: avatarUrl })

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to upload your profile picture.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
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
                    Profile Picture
                  </CardTitle>
                  <CardDescription>Update your profile photo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-2 border-purple-300/20">
                      <AvatarImage
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""}
                        alt={profile?.full_name || user?.user_metadata?.full_name || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-2xl">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Upload a new profile picture. JPG, PNG or GIF, max 5MB.
                      </div>

                      <div className="flex items-center gap-4">
                        <Label
                          htmlFor="avatar-upload"
                          className={`cursor-pointer px-4 py-2 rounded-md border ${
                            uploadingAvatar ? "bg-muted cursor-not-allowed" : "hover:bg-accent"
                          } transition-colors`}
                        >
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2 inline" />
                              Upload Image
                            </>
                          )}
                        </Label>
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />

                        {profile?.avatar_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!user) return

                              try {
                                const { error } = await supabase
                                  .from("profiles")
                                  .update({ avatar_url: null })
                                  .eq("user_id", user.id)

                                if (error) throw error

                                setProfile({ ...profile, avatar_url: null })

                                toast({
                                  title: "Avatar removed",
                                  description: "Your profile picture has been removed.",
                                })
                              } catch (error) {
                                console.error("Error removing avatar:", error)
                                toast({
                                  title: "Error",
                                  description: "Failed to remove your profile picture.",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-500" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <Check className="h-4 w-4 mr-2 text-green-500" /> AI-generated dream art
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
                            <Check className="h-4 w-4 mr-2 text-green-500" /> Voice input & transcription
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
                      <Button variant="outline" className="flex-1">
                        Change Plan
                      </Button>
                    )}
                    {profile?.subscription_tier !== "free" && (
                      <Button variant="destructive" className="flex-1">
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>Manage your payment details</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.subscription_tier !== "free" ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="rounded-md bg-background p-2 border">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-medium">•••• •••• •••• 4242</div>
                          <div className="text-sm text-muted-foreground">Expires 12/25</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No payment method on file</p>
                      <p className="text-sm mt-2">Add a payment method to upgrade your plan</p>
                    </div>
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
  )
}
