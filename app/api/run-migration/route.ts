import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Run the migration to add the timezone column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Pacific Time (UTC-8)';
        COMMENT ON COLUMN public.profiles.timezone IS 'User''s timezone for dream timestamps and notifications';
      `
    })

    if (error) {
      console.error("Error adding timezone column:", error)
      return NextResponse.json({ error: "Failed to run migration", details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error }, { status: 500 })
  }
}
