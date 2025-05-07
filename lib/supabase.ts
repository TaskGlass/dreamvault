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

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
