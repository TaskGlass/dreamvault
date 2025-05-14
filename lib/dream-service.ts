import { supabase } from "./supabase"
import type { Database } from "./database.types"

export type Dream = Database["public"]["Tables"]["dreams"]["Row"] & {
  tags?: string[]
}

// Check if the dreams table exists
export async function checkDreamsTable(): Promise<boolean> {
  try {
    const { error } = await supabase.from("dreams").select("count", { count: "exact", head: true }).limit(1)

    return !error
  } catch (error) {
    console.error("Error checking dreams table:", error)
    return false
  }
}

// Add this function at the top with the other check function
export async function checkProfilesTable(): Promise<boolean> {
  try {
    const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true }).limit(1)

    return !error
  } catch (error) {
    console.error("Error checking profiles table:", error)
    return false
  }
}

// Check if a specific column exists in a table
export async function checkColumnExists(table: string, column: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_column_exists", {
      p_table: table,
      p_column: column,
    })

    if (error) {
      console.error(`Error checking if column ${column} exists in table ${table}:`, error)
      return false
    }

    return data || false
  } catch (error) {
    console.error(`Error checking if column ${column} exists in table ${table}:`, error)
    return false
  }
}

// Check if the artwork_url column exists in the dreams table
export async function checkArtworkUrlColumn(): Promise<boolean> {
  return checkColumnExists("dreams", "artwork_url")
}

// Check if the birthday column exists in the profiles table
export async function checkBirthdayColumn(): Promise<boolean> {
  return checkColumnExists("profiles", "birthday")
}

export async function getDreamsByUserId(userId: string): Promise<Dream[]> {
  try {
    // Check if the table exists
    const tableExists = await checkDreamsTable()
    if (!tableExists) {
      console.warn("Dreams table does not exist. Returning empty array.")
      return []
    }

    // Get dreams
    const { data: dreams, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching dreams:", error)
      return []
    }

    // If no dreams, return empty array
    if (!dreams || dreams.length === 0) {
      return []
    }

    // Get tags for each dream
    const dreamIds = dreams.map((dream) => dream.id)
    const { data: tags, error: tagsError } = await supabase.from("dream_tags").select("*").in("dream_id", dreamIds)

    if (tagsError) {
      console.error("Error fetching dream tags:", tagsError)
      return dreams
    }

    // Combine dreams with their tags
    const dreamsWithTags = dreams.map((dream) => {
      const dreamTags = tags?.filter((tag) => tag.dream_id === dream.id).map((tag) => tag.tag) || []

      return {
        ...dream,
        tags: dreamTags,
      }
    })

    return dreamsWithTags
  } catch (error) {
    console.error("Unexpected error in getDreamsByUserId:", error)
    return []
  }
}

export async function getDreamById(dreamId: string): Promise<Dream | null> {
  try {
    // Check if the table exists
    const tableExists = await checkDreamsTable()
    if (!tableExists) {
      console.warn("Dreams table does not exist. Returning null.")
      return null
    }

    // Get dream
    const { data: dream, error } = await supabase.from("dreams").select("*").eq("id", dreamId).single()

    if (error) {
      console.error("Error fetching dream:", error)
      return null
    }

    // Get tags
    const { data: tags, error: tagsError } = await supabase.from("dream_tags").select("tag").eq("dream_id", dreamId)

    if (tagsError) {
      console.error("Error fetching dream tags:", tagsError)
      return dream
    }

    return {
      ...dream,
      tags: tags.map((t) => t.tag),
    }
  } catch (error) {
    console.error("Unexpected error in getDreamById:", error)
    return null
  }
}

export async function createDream(
  userId: string,
  title: string,
  content: string,
  mood: string | null,
  interpretation: any | null,
  tags: string[] = [],
): Promise<{ dream: Dream | null; error: any }> {
  try {
    // Check if the table exists
    const tableExists = await checkDreamsTable()
    if (!tableExists) {
      return {
        dream: null,
        error: new Error("Database tables do not exist. Please initialize the database first."),
      }
    }

    // Check if artwork_url column exists
    const artworkUrlExists = await checkArtworkUrlColumn()

    // Start a transaction
    const { data: dream, error: dreamError } = await supabase
      .from("dreams")
      .insert({
        user_id: userId,
        title,
        content,
        mood,
        interpretation,
        created_at: new Date().toISOString(),
        has_artwork: interpretation ? true : false,
        has_affirmation: interpretation ? true : false,
        ...(artworkUrlExists ? {} : {}), // Only include artwork_url if the column exists
      })
      .select()
      .single()

    if (dreamError) {
      console.error("Error creating dream:", dreamError)
      return { dream: null, error: dreamError }
    }

    // Insert tags if there are any
    if (tags.length > 0) {
      const tagObjects = tags.map((tag) => ({
        dream_id: dream.id,
        tag,
      }))

      const { error: tagsError } = await supabase.from("dream_tags").insert(tagObjects)

      if (tagsError) {
        console.error("Error adding dream tags:", tagsError)
        return { dream, error: tagsError }
      }
    }

    // Update user's dream count - Fixed approach
    try {
      // First, get the current profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("dreams_count")
        .eq("user_id", userId)
        .single()

      if (fetchError) {
        console.error("Error fetching profile:", fetchError)
      } else {
        // Calculate new count (handle case where dreams_count might be null)
        const currentCount = profile?.dreams_count || 0
        const newCount = currentCount + 1

        // Update with the new count
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ dreams_count: newCount })
          .eq("user_id", userId)

        if (updateError) {
          console.error("Error updating profile dream count:", updateError)
        }
      }
    } catch (profileError) {
      console.error("Error updating profile:", profileError)
    }

    // Generate artwork if interpretation exists and the column exists
    if (interpretation && artworkUrlExists) {
      try {
        const artworkUrl = await generateDreamArtwork(dream.id, content, interpretation)
        if (artworkUrl) {
          // Update the dream with the artwork URL
          const { error: updateError } = await supabase
            .from("dreams")
            .update({ artwork_url: artworkUrl })
            .eq("id", dream.id)

          if (updateError) {
            console.error("Error updating dream with artwork URL:", updateError)
          } else {
            dream.artwork_url = artworkUrl
          }
        }
      } catch (artworkError) {
        console.error("Error generating dream artwork:", artworkError)
        // Continue without artwork - don't fail the dream creation
      }
    }

    return { dream: { ...dream, tags }, error: null }
  } catch (error) {
    console.error("Unexpected error in createDream:", error)
    return { dream: null, error }
  }
}

export async function deleteDream(dreamId: string): Promise<{ success: boolean; error: any }> {
  try {
    // Check if the table exists
    const tableExists = await checkDreamsTable()
    if (!tableExists) {
      return {
        success: false,
        error: new Error("Database tables do not exist. Please initialize the database first."),
      }
    }

    // Delete tags first (foreign key constraint)
    const { error: tagsError } = await supabase.from("dream_tags").delete().eq("dream_id", dreamId)

    if (tagsError) {
      console.error("Error deleting dream tags:", tagsError)
      return { success: false, error: tagsError }
    }

    // Delete the dream
    const { error: dreamError } = await supabase.from("dreams").delete().eq("id", dreamId)

    if (dreamError) {
      console.error("Error deleting dream:", dreamError)
      return { success: false, error: dreamError }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in deleteDream:", error)
    return { success: false, error }
  }
}

// Update the getUserProfile function
export async function getUserProfile(userId: string) {
  try {
    // Check if the table exists
    const tableExists = await checkProfilesTable()
    if (!tableExists) {
      console.warn("Profiles table does not exist. Returning null.")
      return null
    }

    // Check if birthday column exists
    const birthdayColumnExists = await checkBirthdayColumn()

    // Select all columns except birthday if it doesn't exist
    const selectQuery = birthdayColumnExists
      ? "*"
      : "id, user_id, full_name, subscription_tier, dreams_count, dreams_limit, created_at, avatar_url"

    // Remove the .single() method to avoid the error when no rows are found
    const { data, error } = await supabase.from("profiles").select(selectQuery).eq("user_id", userId)

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    // If no profile found, return null
    if (!data || data.length === 0) {
      console.log("No profile found for user:", userId)
      return null
    }

    // If multiple profiles found (shouldn't happen due to UNIQUE constraint),
    // log a warning and use the first one
    if (data.length > 1) {
      console.warn("Multiple profiles found for user:", userId, "Using the first one.")
    }

    return data[0]
  } catch (error) {
    console.error("Unexpected error in getUserProfile:", error)
    return null
  }
}

// Add a function to update the user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Database["public"]["Tables"]["profiles"]["Update"]>,
): Promise<{ success: boolean; error: any }> {
  try {
    // Check if the table exists
    const tableExists = await checkProfilesTable()
    if (!tableExists) {
      return {
        success: false,
        error: new Error("Profiles table does not exist. Please initialize the database first."),
      }
    }

    // Check if birthday column exists if we're trying to update it
    if ("birthday" in updates) {
      const birthdayColumnExists = await checkBirthdayColumn()
      if (!birthdayColumnExists) {
        console.warn("Birthday column does not exist. Removing from updates.")
        delete updates.birthday
      }
    }

    const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId)

    if (error) {
      console.error("Error updating user profile:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in updateUserProfile:", error)
    return { success: false, error }
  }
}

// New function to generate dream artwork
export async function generateDreamArtwork(
  dreamId: string,
  dreamText: string,
  interpretation: any,
): Promise<string | null> {
  try {
    // Use a relative URL instead of relying on NEXT_PUBLIC_APP_URL
    const response = await fetch(`/api/generate-artwork`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dreamId, dreamText, interpretation }),
    })

    // First check if the response is ok
    if (!response.ok) {
      // Try to parse the error as JSON, but handle non-JSON responses too
      let errorMessage = "Failed to generate artwork"
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (parseError) {
        // If we can't parse as JSON, use the status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    // If response is ok, try to parse the JSON
    try {
      const data = await response.json()
      return data.imageUrl
    } catch (parseError) {
      console.error("Error parsing response:", parseError)
      throw new Error("Invalid response format from artwork generation API")
    }
  } catch (error) {
    console.error("Error generating dream artwork:", error)
    throw error // Re-throw the error so we can handle it in the component
  }
}

// New function to share dream content
export async function shareDreamContent(
  type: "artwork" | "affirmation" | "dream",
  content: string,
  dreamId?: string,
  title?: string,
): Promise<{ shareUrl: string | null; error: any }> {
  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, content, dreamId, title }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to share content")
    }

    const data = await response.json()
    return { shareUrl: data.shareUrl, error: null }
  } catch (error) {
    console.error("Error sharing dream content:", error)
    return { shareUrl: null, error }
  }
}

// New function to get shared content by ID
export async function getSharedContent(shareId: string): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.from("dream_shares").select("*").eq("id", shareId).single()

    if (error) {
      return { data: null, error }
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from("dream_shares")
      .update({ views: (data.views || 0) + 1 })
      .eq("id", shareId)

    if (updateError) {
      console.error("Error updating view count:", updateError)
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error getting shared content:", error)
    return { data: null, error }
  }
}

// New function to get user's zodiac sign based on birthday
export function getZodiacSign(birthday: string | null): string | null {
  if (!birthday) return null

  try {
    const date = new Date(birthday)
    const month = date.getMonth() + 1 // JavaScript months are 0-indexed
    const day = date.getDate()

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries"
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus"
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini"
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer"
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo"
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo"
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra"
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio"
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius"
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn"
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius"
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces"

    return null
  } catch (error) {
    console.error("Error determining zodiac sign:", error)
    return null
  }
}

// Function to run the migration to add the birthday column
export async function addBirthdayColumn(): Promise<{ success: boolean; error: any }> {
  try {
    // Check if the column already exists
    const birthdayColumnExists = await checkBirthdayColumn()

    if (birthdayColumnExists) {
      console.log("Birthday column already exists.")
      return { success: true, error: null }
    }

    // Execute the SQL to add the column
    const { error } = await supabase.rpc("run_sql", {
      sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;",
    })

    if (error) {
      console.error("Error adding birthday column:", error)
      return { success: false, error }
    }

    console.log("Birthday column added successfully.")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error adding birthday column:", error)
    return { success: false, error }
  }
}
