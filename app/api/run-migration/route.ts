import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Running migration to add birthday column to profiles table")

    // Execute the SQL directly instead of using a function
    const { error } = await supabase.rpc("run_sql", {
      sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;",
    })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: "Failed to run migration", details: error.message }, { status: 500 })
    }

    console.log("Migration completed successfully")
    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error: any) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error.message }, { status: 500 })
  }
}
