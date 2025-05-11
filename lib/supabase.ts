import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Environment variables for client-side
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client for client-side operations
let supabase = createSupabaseClient()

// Function to create a Supabase client
function createSupabaseClient() {
  // Check if required client-side environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      `Missing required environment variables: ${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}. Please check your environment configuration.`,
    )
  }

  return createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
    // Add global error handler
    global: {
      fetch: (...args) => {
        return fetch(...args).catch((err) => {
          console.error("Supabase fetch error:", err)
          throw err
        })
      },
    },
  })
}

// Function to reconnect to Supabase with fresh environment variables
export function reconnectSupabase() {
  // Re-read environment variables
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Create a new client
  supabase = createSupabaseClient()

  return {
    success: true,
    client: supabase,
    url: supabaseUrl,
    hasCredentials: !!(supabaseUrl && supabaseAnonKey),
  }
}

// Create admin client for server-side operations (only used in API routes)
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Only check for service role key when creating admin client
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing required environment variables for admin client: ${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!supabaseServiceKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""}. Please check your environment configuration.`,
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper function to check if Supabase is properly configured
export async function checkSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        connected: false,
        error: "Missing Supabase environment variables",
        status: null,
      }
    }

    const { data, error, status } = await supabase.from("profiles").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error.message)
      return {
        connected: false,
        error: error.message,
        status,
      }
    }

    console.log("Supabase connection successful")
    return {
      connected: true,
      error: null,
      status,
    }
  } catch (err: any) {
    console.error("Error checking Supabase connection:", err)
    return {
      connected: false,
      error: err.message || "Unknown error",
      status: null,
    }
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

// Helper function to verify all required environment variables are present
export function verifyEnvironmentVariables() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([name]) => name)

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`)
    return {
      valid: false,
      missing: missingVars,
    }
  }

  return {
    valid: true,
    missing: [],
  }
}

// Export the supabase client
export { supabase }
