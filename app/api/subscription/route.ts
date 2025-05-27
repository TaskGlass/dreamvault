import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId, newTier } = await request.json()

    if (!userId || !newTier) {
      return NextResponse.json(
        { message: "Missing required parameters: userId and newTier" },
        { status: 400 },
      )
    }

    // Validate the subscription tier
    if (!["free", "starter", "pro"].includes(newTier)) {
      return NextResponse.json(
        { message: "Invalid subscription tier" },
        { status: 400 },
      )
    }

    // Update the user's subscription tier
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: newTier })
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating subscription:", error)
      return NextResponse.json(
        { message: "Failed to update subscription" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      newTier,
    })
  } catch (error) {
    console.error("Error in subscription route:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
} 