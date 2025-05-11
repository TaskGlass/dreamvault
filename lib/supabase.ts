import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anon Key is missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.",
  )
}

// Create Supabase client with improved configuration
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable automatic detection to avoid conflicts
    flowType: "pkce", // Use PKCE flow for better security
  },
})

// Helper function to check if Supabase is properly configured
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error.message)
      return false
    }

    console.log("Supabase connection successful")
    return true
  } catch (err) {
    console.error("Error checking Supabase connection:", err)
    return false
  }
}

// Helper function to safely sign out
export async function safeSignOut() {
  try {
    // First clear any stored session data
    if (typeof window !== "undefined") {
      const storageKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("sb-") || key.includes("supabase") || key.includes("auth"),
      )

      for (const key of storageKeys) {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.warn(`Failed to remove item ${key} from localStorage`, e)
        }
      }
    }

    // Then sign out through the API
    await supabase.auth.signOut({ scope: "local" })

    return { success: true }
  } catch (error) {
    console.error("Safe sign out error:", error)
    return { success: false, error }
  }
}
