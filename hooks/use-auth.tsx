"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ensureDatabaseSetup } from "@/lib/db-init"
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
            setIsLoading(false)
          }
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          // If user is logged in, ensure database is set up
          if (session?.user) {
            try {
              await ensureDatabaseSetup(session.user.id, session.user.user_metadata?.full_name || "")
            } catch (err) {
              console.error("Error ensuring database setup:", err)
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error during session check:", err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    setData()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)

        // If user is logged in, ensure database is set up
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          try {
            await ensureDatabaseSetup(session.user.id, session.user.user_metadata?.full_name || "")
          } catch (err) {
            console.error("Error ensuring database setup:", err)
          }
        }

        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
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
        // Database setup will be handled by the auth state change listener
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
        // Database setup will be handled by the auth state change listener
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
      setUser(null)
      setSession(null)
      router.push("/")
    } catch (err) {
      console.error("Sign out error:", err)
      router.push("/")
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
