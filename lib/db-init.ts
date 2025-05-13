import { supabase } from "./supabase"

export async function checkDatabaseTables() {
  console.log("Checking database tables...")

  try {
    // Check if the profiles table exists
    const { error: profilesCheckError } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true })
      .limit(1)

    // Check if the dreams table exists
    const { error: dreamsCheckError } = await supabase
      .from("dreams")
      .select("count", { count: "exact", head: true })
      .limit(1)

    // Check if the dream_tags table exists
    const { error: tagsCheckError } = await supabase
      .from("dream_tags")
      .select("count", { count: "exact", head: true })
      .limit(1)

    const profilesExist = !profilesCheckError
    const dreamsExist = !dreamsCheckError
    const tagsExist = !tagsCheckError

    return {
      allTablesExist: profilesExist && dreamsExist && tagsExist,
      profilesExist,
      dreamsExist,
      tagsExist,
    }
  } catch (error) {
    console.error("Error checking database tables:", error)
    return {
      allTablesExist: false,
      profilesExist: false,
      dreamsExist: false,
      tagsExist: false,
      error,
    }
  }
}

export async function initializeDatabase() {
  try {
    const response = await fetch("/api/init-db", {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        message: errorData.message || "Failed to initialize database",
      }
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error("Error initializing database:", error)
    return {
      success: false,
      message: `Error initializing database: ${error.message}`,
    }
  }
}

export async function createUserProfile(userId: string, fullName = "") {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: fullName,
        subscription_tier: "free",
        dreams_count: 0,
        dreams_limit: 5,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating user profile:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error creating user profile:", error)
    return { success: false, error }
  }
}

// Helper function to fix corrupted profiles
export async function fixCorruptedProfiles() {
  try {
    // Get all profiles
    const { data: profiles, error } = await supabase.from("profiles").select("user_id, avatar_url")

    if (error) {
      console.error("Error fetching profiles:", error)
      return { success: false, error }
    }

    let fixedCount = 0

    // Check each profile for corrupted avatar_url
    for (const profile of profiles || []) {
      if (typeof profile.avatar_url === "string" && profile.avatar_url.length > 1000000) {
        console.log(`Fixing corrupted avatar for user ${profile.user_id}`)

        // Reset the avatar URL
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: null })
          .eq("user_id", profile.user_id)

        if (!updateError) {
          fixedCount++
        }
      }
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} corrupted profiles`,
    }
  } catch (error) {
    console.error("Error fixing corrupted profiles:", error)
    return { success: false, error }
  }
}
