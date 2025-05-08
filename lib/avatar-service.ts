import { supabase } from "./supabase"

/**
 * Uploads an avatar image to Supabase Storage
 * Falls back to base64 encoding if storage is unavailable
 */
export async function uploadAvatar(file: File, userId: string) {
  try {
    // First try to use the storage bucket
    try {
      // Check if the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const avatarsBucketExists = buckets?.some((bucket) => bucket.name === "avatars")

      // If the bucket exists, use it
      if (avatarsBucketExists) {
        const fileName = `avatar-${userId}-${Date.now()}`
        const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        })

        if (error) throw error

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path)
        return { url: publicUrlData.publicUrl, error: null }
      }
    } catch (storageError) {
      console.error("Storage upload failed, falling back to base64:", storageError)
    }

    // Fallback: Convert to base64 and store in the profile directly
    return await convertToBase64AndStore(file, userId)
  } catch (error) {
    console.error("Error in avatar upload:", error)
    return { url: null, error }
  }
}

/**
 * Fallback method that converts an image to base64 and stores it in the profile
 */
async function convertToBase64AndStore(file: File, userId: string) {
  return new Promise<{ url: string | null; error: any }>((resolve) => {
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const base64String = event.target?.result as string

        // Store the base64 string in the profile
        const { error } = await supabase.from("profiles").update({ avatar_url: base64String }).eq("user_id", userId)

        if (error) throw error

        resolve({ url: base64String, error: null })
      } catch (error) {
        console.error("Error storing base64 avatar:", error)
        resolve({ url: null, error })
      }
    }

    reader.onerror = (error) => {
      console.error("Error reading file:", error)
      resolve({ url: null, error })
    }

    reader.readAsDataURL(file)
  })
}
