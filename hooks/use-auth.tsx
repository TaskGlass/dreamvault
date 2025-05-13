"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase, safeSignOut } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isError: boolean
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string; birthday?: string },
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let mounted = true

    const setData = async () => {
      try {
        setIsLoading(true)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          if (mounted) {
            setIsError(true)
            setIsLoading(false)
          }
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setIsError(false)
        }
      } catch (err) {
        console.error("Unexpected error during session check:", err)
        if (mounted) {
          setIsError(true)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    setData()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)

        // Reset error state on successful auth events
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setIsError(false)
        }
      }
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  // Update the signUp function in the AuthProvider component
  const signUp = async (email: string, password: string, metadata?: { full_name?: string; birthday?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (!error && data?.user) {
        try {
          // Create a profile for the new user
          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            full_name: metadata?.full_name || "",
            birthday: metadata?.birthday || null,
            subscription_tier: "free",
            dreams_count: 0,
            dreams_limit: 5,
            created_at: new Date().toISOString(),
          })

          if (profileError) {
            console.error("Error creating profile during signup:", profileError)
            // Don't return an error here, as the user was created successfully
          }
        } catch (err) {
          console.error("Unexpected error creating profile:", err)
        }
      }

      return { data, error }
    } catch (err) {
      console.error("Signup error:", err)
      return { data: null, error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with:", email)
      setIsError(false)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Sign in result:", error ? "Error" : "Success", data?.user?.email)

      if (!error) {
        // Successful login
        console.log("Login successful, user:", data.user?.email)
      } else {
        setIsError(true)
      }

      return { data, error }
    } catch (err) {
      console.error("Login error:", err)
      setIsError(true)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    try {
      // Use the safe sign out helper
      const { success, error } = await safeSignOut()

      if (!success) {
        console.error("Error during sign out:", error)
      }

      // Clear state regardless of API success
      setUser(null)
      setSession(null)

      // Navigate to home page
      router.push("/")
    } catch (err) {
      console.error("Sign out error:", err)
      // Still try to navigate away even if there's an error
      router.push("/")
    }
  }

  const value = {
    user,
    session,
    isLoading,
    isError,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
