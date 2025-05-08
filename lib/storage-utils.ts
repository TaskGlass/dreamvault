import { supabase } from "./supabase"

/**
 * Ensures that required storage buckets exist
 * This can be called during app initialization
 */
export async function initializeStorageBuckets() {
  try {
    // Check if the avatars bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error("Error checking storage buckets:", error)
      return false
    }

    const avatarsBucketExists = buckets.some((bucket) => bucket.name === "avatars")

    // Create the avatars bucket if it doesn't exist
    if (!avatarsBucketExists) {
      const { error: createError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      })

      if (createError) {
        console.error("Error creating avatars bucket:", createError)
        return false
      }

      console.log("Created avatars bucket successfully")

      // Set up public access policy for the avatars bucket
      const { error: policyError } = await supabase.storage.from("avatars").createSignedUrl("dummy-path", 1)
      if (policyError && !policyError.message.includes("not found")) {
        console.error("Error setting up bucket policies:", policyError)
      }
    }

    return true
  } catch (error) {
    console.error("Error initializing storage buckets:", error)
    return false
  }
}
