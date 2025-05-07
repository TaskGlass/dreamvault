"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string },
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

  useEffect(() => {
    const setData = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setIsLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error("Unexpected error during session check:", err)
      } finally {
        setIsLoading(false)
      }
    }

    setData()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  // Update the signUp function in the AuthProvider component
  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (!error && data?.user) {
        try {
          // Create a profile for the new user
          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            full_name: metadata?.full_name || "",
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Sign in result:", error ? "Error" : "Success", data?.user?.email)

      if (!error) {
        // Successful login
        console.log("Login successful, user:", data.user?.email)
      }

      return { data, error }
    } catch (err) {
      console.error("Login error:", err)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      console.error("Sign out error:", err)
    }
  }

  const value = {
    user,
    session,
    isLoading,
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
