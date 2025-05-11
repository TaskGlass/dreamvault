import { NextResponse } from "next/server"
import { reconnectSupabase, checkSupabaseConnection } from "@/lib/supabase"

export async function POST() {
  try {
    // Reconnect to Supabase
    const reconnectResult = reconnectSupabase()

    if (!reconnectResult.hasCredentials) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing Supabase credentials. Please check your environment variables.",
          url: reconnectResult.url,
        },
        { status: 500 },
      )
    }

    // Test the connection
    const connectionTest = await checkSupabaseConnection()

    if (!connectionTest.connected) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to connect to Supabase: ${connectionTest.error}`,
          status: connectionTest.status,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully reconnected to Supabase",
      status: connectionTest.status,
    })
  } catch (error: any) {
    console.error("Error reconnecting to Supabase:", error)
    return NextResponse.json(
      {
        success: false,
        message: `An unexpected error occurred: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
