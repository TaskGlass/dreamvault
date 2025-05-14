import { NextResponse } from "next/server"
import { addBirthdayColumn } from "@/lib/dream-service"

export async function GET() {
  try {
    // Run the migration to add the birthday column
    const { success, error } = await addBirthdayColumn()

    if (!success) {
      return NextResponse.json({ error: "Failed to run migration", details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error }, { status: 500 })
  }
}
