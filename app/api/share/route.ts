import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { nanoid } from "nanoid"

// Define the types of content that can be shared
type ShareType = "artwork" | "affirmation" | "dream"

export async function POST(request: Request) {
  try {
    // Get the share data from the request body
    const { type, content, dreamId, title } = await request.json()

    if (!type || !content) {
      return NextResponse.json({ error: "Type and content are required" }, { status: 400 })
    }

    // Validate the share type
    if (!["artwork", "affirmation", "dream"].includes(type)) {
      return NextResponse.json({ error: "Invalid share type" }, { status: 400 })
    }

    // Generate a unique share ID
    const shareId = nanoid(10)

    // Create a share record in the database
    const { error } = await supabase.from("dream_shares").insert({
      id: shareId,
      dream_id: dreamId || null,
      share_type: type as ShareType,
      content,
      title: title || "Shared Dream",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiry
    })

    if (error) {
      throw error
    }

    // Generate the share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://dreamvault.app"}/share/${shareId}`

    return NextResponse.json({ shareId, shareUrl })
  } catch (error: any) {
    console.error("Error creating share:", error)
    return NextResponse.json(
      { error: "Failed to create share", message: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}
