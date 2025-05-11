"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getUserProfile } from "@/lib/dream-service"
import { verifyEnvironmentVariables } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type ProfileContextType = {
  profile: any | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check environment variables on mount
  useEffect(() => {
    const envCheck = verifyEnvironmentVariables()
    if (!envCheck.valid) {
      setError(`Missing Supabase environment variables: ${envCheck.missing.join(", ")}`)
      toast({
        title: "Configuration Error",
        description: "The application is missing required environment variables.",
        variant: "destructive",
      })
    }
  }, [toast])

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile fetch timed out")), 10000)
      })

      // Race the profile fetch against the timeout
      const userProfile = await Promise.race([getUserProfile(user.id), timeoutPromise])

      if (userProfile) {
        setProfile(userProfile)
      } else {
        // If no profile, create a default one
        setProfile({
          id: user.id,
          user_id: user.id,
          full_name: user.user_metadata?.full_name || "",
          subscription_tier: "free",
          dreams_limit: 10,
          dreams_count: 0,
          created_at: new Date().toISOString(),
        })

        setError("Could not retrieve profile from Supabase. Using default profile.")
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err.message : String(err))

      // Use a default profile even if there's an error
      setProfile({
        id: user.id,
        user_id: user.id,
        full_name: user.user_metadata?.full_name || "",
        subscription_tier: "free",
        dreams_limit: 10,
        dreams_count: 0,
        created_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (user && !error) {
      fetchProfile()
    }
  }, [user, error])

  // Function to refresh profile data
  const refreshProfile = async () => {
    await fetchProfile()
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile }}>{children}</ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
