import { NextResponse } from "next/server"
import { checkSupabaseConnection } from "@/lib/supabase"

export async function GET() {
  try {
    const isConnected = await checkSupabaseConnection()
    return NextResponse.json({ success: isConnected })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
} 