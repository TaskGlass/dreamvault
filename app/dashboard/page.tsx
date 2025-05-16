"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DreamCard } from "@/components/dream-card"
import { InsightCard } from "@/components/insight-card"
import { Plus, Brain, Sparkles, BookOpen, Calendar, Moon, Zap, Database, RefreshCw, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getDreamsByUserId, getUserProfile } from "@/lib/dream-service"
import type { Dream } from "@/lib/dream-service"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { checkDatabaseTables, initializeDatabase, createUserProfile } from "@/lib/db-init"
import { cn } from "@/lib/utils"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [initializingDb, setInitializingDb] = useState(false)
  const [activeTab, setActiveTab] = useState<"recent" | "insights">("recent")
  const [avatarError, setAvatarError] = useState(false)
  const supabase = useSupabaseClient()

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        setDbError(null)
        setAvatarError(false)

        // First check if the database tables exist
        const { allTablesExist } = await checkDatabaseTables()

        if (!allTablesExist) {
          setDbError("Database tables not found. Please initialize the database.")
          setLoading(false)
          return
        }

        // Fetch user profile and dreams
        let userProfile = await getUserProfile(user.id)

        // If profile doesn't exist, create one
        if (!userProfile) {
          console.log("Creating new profile for user:", user.id)
          const fullName = user.user_metadata?.full_name || ""
          const { success } = await createUserProfile(user.id, fullName)

          if (success) {
            userProfile = await getUserProfile(user.id)
          } else {
            console.error("Failed to create user profile")
          }
        }

        // Check if avatar URL is valid and fix if needed
        if (userProfile && userProfile.avatar_url) {
          // If avatar URL is extremely long (likely a corrupted base64), reset it
          if (typeof userProfile.avatar_url === "string" && userProfile.avatar_url.length > 1000000) {
            console.warn("Avatar URL is too long, resetting it")
            setAvatarError(true)

            // Reset the avatar URL in the profile
            await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id)

            // Update user metadata
            await supabase.auth.updateUser({
              data: { avatar_url: null },
            })

            // Update local profile
            userProfile.avatar_url = null
          }
        }

        const userDreams = await getDreamsByUserId(user.id)

        setDreams(userDreams)
        setProfile(userProfile)
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)

        // Check if the error is related to missing tables
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          setDbError("Database tables not found. Please initialize the database.")
        } else {
          setDbError("An error occurred while loading your data. Please try again later.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, supabase])

  // Show a toast if avatar error was detected and fixed
  useEffect(() => {
    if (avatarError) {
      toast({
        title: "Profile picture reset",
        description:
          "We detected an issue with your profile picture and have reset it. You can upload a new one in settings.",
        variant: "warning",
      })
    }
  }, [avatarError, toast])

  const handleInitializeDatabase = async () => {
    if (!user) return

    setInitializingDb(true)
    try {
      const result = await initializeDatabase()

      if (result.success) {
        toast({
          title: "Database initialized",
          description: "The database has been set up successfully. Refreshing your data...",
        })

        // Create a profile for the user
        await createUserProfile(user.id, user.user_metadata?.full_name || "")

        // Refresh the data
        const [userDreams, userProfile] = await Promise.all([getDreamsByUserId(user.id), getUserProfile(user.id)])

        setDreams(userDreams)
        setProfile(userProfile)
        setDbError(null)
      } else {
        toast({
          title: "Initialization failed",
          description: result.message || "Failed to initialize the database. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setInitializingDb(false)
    }
  }

  // Calculate stats
  const dreamsThisWeek = dreams.filter((dream) => {
    const dreamDate = new Date(dream.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return dreamDate >= weekAgo
  }).length

  const dreamsThisMonth = dreams.filter((dream) => {
    const dreamDate = new Date(dream.created_at)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return dreamDate >= monthAgo
  }).length

  // Find most common mood
  const moodCounts: Record<string, number> = {}
  dreams.forEach((dream) => {
    if (dream.mood) {
      moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1
    }
  })

  const mostFrequentMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None recorded yet"

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.user_metadata?.full_name) return "DV"
    const nameParts = user.user_metadata.full_name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    }
    return nameParts[0].substring(0, 2).toUpperCase()
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Get recent dreams (last 3)
  const recentDreams = dreams.slice(0, 3)

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] w-full min-w-0 flex-1">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-75 blur-sm"></div>
          <div className="absolute inset-4 rounded-full bg-background"></div>
          <Moon className="absolute inset-0 m-auto h-6 w-6 text-purple-500" />
        </div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading your dream space...</p>
      </div>
    )
  }

  if (dbError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] w-full min-w-0 flex-1">
        <Database className="h-12 w-12 text-purple-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Database Setup Required</h2>
        <p className="text-muted-foreground mb-6">
          It looks like the database tables for DreamVault haven't been created yet.
        </p>
        <Alert variant="warning" className="mb-6 bg-amber-500/10 border-amber-500/50">
          <AlertTitle>First-time setup</AlertTitle>
          <AlertDescription>
            This is a one-time setup process that will create the necessary database tables for DreamVault to work
            properly.
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleInitializeDatabase}
          disabled={initializingDb}
          className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        >
          {initializingDb ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Initializing Database...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Initialize Database
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-8 sm:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your dream journal</p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="h-10 w-10">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      {/* Welcome section with user info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-background/60 p-4 md:p-6 rounded-xl border border-purple-300/10 shadow-sm w-full min-w-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-purple-200/20">
            <AvatarImage
              src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""}
              alt={profile?.full_name || user?.user_metadata?.full_name || "User"}
              onError={(e) => {
                // If image fails to load, remove the src to show fallback
                e.currentTarget.src = ""
              }}
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-lg md:text-xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {(profile?.full_name || user?.user_metadata?.full_name || "").split(" ")[0] || "User"}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {dreams.length > 0
                ? `You've recorded ${dreams.length} dream${dreams.length > 1 ? "s" : ""}`
                : "Start recording your dreams to unlock insights"}
            </p>
          </div>
        </div>
        <Button
          className="rounded-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md shadow-purple-500/10 px-6"
          asChild
          size="lg"
        >
          <Link href="/dashboard/interpret">
            <Plus className="h-4 w-4" />
            New Dream
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full min-w-0">
        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Brain className="h-5 w-5 text-purple-500" />
              Dream Insights
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Total dreams analyzed</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl md:text-3xl font-bold">{dreams.length}</div>
            <div className="flex items-center text-xs md:text-sm text-muted-foreground mt-2">
              <Zap className="h-3.5 w-3.5 mr-1 text-purple-500" />
              {dreamsThisWeek} dreams this week
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Mood Insights
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Your dream emotions</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl md:text-3xl font-bold">
              {mostFrequentMood === "None recorded yet" ? (
                <span className="text-lg md:text-xl text-muted-foreground font-normal">None recorded yet</span>
              ) : (
                mostFrequentMood
              )}
            </div>
            <div className="flex items-center text-xs md:text-sm text-muted-foreground mt-2">
              <Zap className="h-3.5 w-3.5 mr-1 text-purple-500" />
              Most frequent mood
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden sm:col-span-2 lg:col-span-1 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-bl-full"></div>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="h-5 w-5 text-purple-500" />
              Dream Streak
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Your journaling consistency</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl md:text-3xl font-bold">{dreamsThisMonth}</div>
              <div className="text-xs md:text-sm text-muted-foreground">This month</div>
            </div>
            <Progress value={dreamsThisMonth ? (dreamsThisMonth / 30) * 100 : 0} className="h-2 bg-purple-100/10" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs Container */}
      <div className="w-full min-w-0 bg-background/30 backdrop-blur-sm rounded-lg border border-purple-300/10 overflow-hidden">
        {/* Tab Buttons */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "recent" | "insights")} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Recent Dreams</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <div className="p-4 md:p-6 w-full min-w-0">
              <div className="flex items-center justify-between mb-4 md:mb-6 w-full">
                <h2 className="text-lg md:text-xl font-semibold">Recent Dreams</h2>
                <Button variant="ghost" size="sm" asChild className="gap-1">
                  <Link href="/dashboard/journal">
                    View all
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </Button>
              </div>

              {recentDreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full min-w-0">
                  {recentDreams.map((dream) => (
                    <DreamCard
                      key={dream.id}
                      dream={{
                        id: dream.id,
                        title: dream.title,
                        date: new Date(dream.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                        summary: dream.content.substring(0, 120) + (dream.content.length > 120 ? "..." : ""),
                        mood: dream.mood || "Unknown",
                        tags: dream.tags || [],
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 min-h-[250px] border border-dashed border-purple-300/20 rounded-lg w-full">
                  <div className="rounded-full bg-purple-500/10 p-3 mb-4">
                    <Moon className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center mb-5">No dreams recorded yet</p>
                  <Button asChild size="lg" className="px-6">
                    <Link href="/dashboard/interpret">Record Your First Dream</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="p-4 md:p-6 w-full min-w-0">
              <div className="flex items-center justify-between mb-4 md:mb-6 w-full">
                <h2 className="text-lg md:text-xl font-semibold">Dream Insights</h2>
                <Button variant="ghost" size="sm" asChild className="gap-1">
                  <Link href="/dashboard/insights">
                    View all
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full min-w-0">
                <InsightCard
                  title="Recurring Themes"
                  description={
                    dreams.length > 0
                      ? `You have ${dreams.length > 1 ? "recurring themes of " + mostFrequentMood : "recorded one dream"}.`
                      : "Record dreams to discover recurring themes and patterns."
                  }
                  icon={Sparkles}
                />
                <InsightCard
                  title="Emotional Patterns"
                  description={
                    dreams.length > 0
                      ? `Your dreams show ${mostFrequentMood} as your most common emotional state.`
                      : "Track your dream emotions to reveal patterns over time."
                  }
                  icon={Brain}
                />
                <InsightCard
                  title="Dream Timeline"
                  description={
                    dreams.length > 0
                      ? `You've recorded ${dreamsThisMonth} dreams in the past month.`
                      : "Track your dream frequency over time."
                  }
                  icon={Calendar}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Subscription Status */}
      {profile && (
        <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden shadow-sm mb-0 w-full min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BookOpen className="h-5 w-5 text-purple-500" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium capitalize text-base md:text-lg">
                    {profile.subscription_tier === "pro"
                      ? "Astral Voyager"
                      : profile.subscription_tier === "starter"
                        ? "Lucid Explorer"
                        : "Dreamer Lite"}
                  </span>
                  {profile.subscription_tier !== "free" && (
                    <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <Progress value={(dreams.length / profile.dreams_limit) * 100} className="h-2.5 bg-purple-100/10" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                  {dreams.length} / {profile.dreams_limit} dreams used this month
                </p>
              </div>
              {profile.subscription_tier === "free" && (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 px-6"
                >
                  <Link href="/dashboard/settings?tab=subscription">Upgrade Now</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
