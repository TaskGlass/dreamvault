import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { handleApiError } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // Create admin client to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient.from("profiles").insert({
      id: userId,
      full_name: fullName || "",
      subscription_tier: "free",
      dreams_limit: 10,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating profile:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
