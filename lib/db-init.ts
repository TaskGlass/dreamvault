import { supabase } from "./supabase"
import { verifyEnvironmentVariables } from "./supabase"

// Check if all required database tables exist
export async function checkDatabaseTables() {
  try {
    // First verify environment variables
    const envCheck = verifyEnvironmentVariables()
    if (!envCheck.valid) {
      return {
        allTablesExist: false,
        errors: [`Missing required environment variables: ${envCheck.missing.join(", ")}`],
      }
    }

    // Check if the profiles table exists
    const { error: profilesError } = await supabase.from("profiles").select("id").limit(1)

    // Check if the dreams table exists
    const { error: dreamsError } = await supabase.from("dreams").select("id").limit(1)

    // Check if the dream_tags table exists
    const { error: tagsError } = await supabase.from("dream_tags").select("id").limit(1)

    const errors = []
    if (profilesError) errors.push(`Profiles table error: ${profilesError.message}`)
    if (dreamsError) errors.push(`Dreams table error: ${dreamsError.message}`)
    if (tagsError) errors.push(`Dream tags table error: ${tagsError.message}`)

    return {
      allTablesExist: !profilesError && !dreamsError && !tagsError,
      errors: errors.length > 0 ? errors : null,
    }
  } catch (error: any) {
    console.error("Error checking database tables:", error)
    return {
      allTablesExist: false,
      errors: [error.message || "Unknown error checking database tables"],
    }
  }
}

// Initialize the database
export async function initializeDatabase() {
  try {
    // First verify environment variables
    const envCheck = verifyEnvironmentVariables()
    if (!envCheck.valid) {
      return {
        success: false,
        message: `Missing required environment variables: ${envCheck.missing.join(", ")}`,
      }
    }

    const response = await fetch("/api/init-db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        message: errorData.message || `Failed to initialize database: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return {
      success: data.success,
      message: data.message,
    }
  } catch (error: any) {
    console.error("Error initializing database:", error)
    return {
      success: false,
      message: error.message || "An unexpected error occurred while initializing the database",
    }
  }
}

// Create a user profile
export async function createUserProfile(userId: string, fullName: string) {
  try {
    // First verify environment variables
    const envCheck = verifyEnvironmentVariables()
    if (!envCheck.valid) {
      return {
        success: false,
        error: `Missing required environment variables: ${envCheck.missing.join(", ")}`,
      }
    }

    // Try to create the profile directly first
    const { error } = await supabase.from("profiles").insert({
      user_id: userId,
      full_name: fullName || "",
      subscription_tier: "free",
      dreams_limit: 10,
      created_at: new Date().toISOString(),
    })

    // If there's an error (likely due to RLS), try using the API route
    if (error) {
      console.log("Error creating profile directly, trying API route:", error)

      try {
        const response = await fetch("/api/create-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, fullName }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          return {
            success: false,
            error: errorData.message || `Failed to create profile: ${response.statusText}`,
          }
        }

        const data = await response.json()
        return {
          success: data.success,
          error: null,
        }
      } catch (apiError: any) {
        console.error("Error creating profile via API:", apiError)
        return {
          success: false,
          error: apiError.message || "An unexpected error occurred while creating the profile",
        }
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (error: any) {
    console.error("Error creating user profile:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred while creating the profile",
    }
  }
}

// Ensure database is set up and profile exists
export async function ensureDatabaseSetup(userId: string, fullName: string) {
  try {
    // First verify environment variables
    const envCheck = verifyEnvironmentVariables()
    if (!envCheck.valid) {
      throw new Error(`Missing required environment variables: ${envCheck.missing.join(", ")}`)
    }

    // Check if database tables exist
    const { allTablesExist, errors } = await checkDatabaseTables()

    // If tables don't exist, initialize the database
    if (!allTablesExist) {
      console.log("Database tables don't exist, initializing...")
      const { success, message } = await initializeDatabase()
      if (!success) {
        throw new Error(message || "Failed to initialize database")
      }
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    // If profile doesn't exist or there was an error, create one
    if (!profile || profileError) {
      console.log("Profile doesn't exist, creating...")
      const { success, error } = await createUserProfile(userId, fullName)
      if (!success) {
        throw new Error(error || "Failed to create user profile")
      }
    }

    return true
  } catch (error: any) {
    console.error("Error ensuring database setup:", error)
    throw error
  }
}
