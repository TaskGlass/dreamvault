import { NextResponse } from "next/server"
import { checkBirthdayColumn } from "@/lib/dream-service"

export async function GET() {
  try {
    const exists = await checkBirthdayColumn()
    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error checking birthday column:", error)
    return NextResponse.json({ exists: false, error: "Failed to check birthday column" }, { status: 500 })
  }
}
