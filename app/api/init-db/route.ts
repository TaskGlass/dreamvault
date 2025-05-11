import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { verifyEnvironmentVariables } from "@/lib/supabase"

// SQL statements for creating tables
const createTablesSQL = `
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  dreams_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dreams table if it doesn't exist
CREATE TABLE IF NOT EXISTS dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  interpretation TEXT,
  mood TEXT,
  tags TEXT[],
  is_lucid BOOLEAN DEFAULT FALSE,
  is_nightmare BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  artwork_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dream_shares table if it doesn't exist
CREATE TABLE IF NOT EXISTS dream_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Profiles policies
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_policy'
  ) THEN
    CREATE POLICY profiles_select_policy ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_policy'
  ) THEN
    CREATE POLICY profiles_insert_policy ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy'
  ) THEN
    CREATE POLICY profiles_update_policy ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Dreams policies
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dreams' AND policyname = 'dreams_select_policy'
  ) THEN
    CREATE POLICY dreams_select_policy ON dreams
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dreams' AND policyname = 'dreams_insert_policy'
  ) THEN
    CREATE POLICY dreams_insert_policy ON dreams
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dreams' AND policyname = 'dreams_update_policy'
  ) THEN
    CREATE POLICY dreams_update_policy ON dreams
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dreams' AND policyname = 'dreams_delete_policy'
  ) THEN
    CREATE POLICY dreams_delete_policy ON dreams
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Dream shares policies
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dream_shares' AND policyname = 'dream_shares_select_policy'
  ) THEN
    CREATE POLICY dream_shares_select_policy ON dream_shares
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM dreams WHERE dreams.id = dream_shares.dream_id AND dreams.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dream_shares' AND policyname = 'dream_shares_insert_policy'
  ) THEN
    CREATE POLICY dream_shares_insert_policy ON dream_shares
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM dreams WHERE dreams.id = dream_shares.dream_id AND dreams.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'dream_shares' AND policyname = 'dream_shares_delete_policy'
  ) THEN
    CREATE POLICY dream_shares_delete_policy ON dream_shares
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM dreams WHERE dreams.id = dream_shares.dream_id AND dreams.user_id = auth.uid()
        )
      );
  END IF;

  -- Enable RLS on tables
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
  ALTER TABLE dream_shares ENABLE ROW LEVEL SECURITY;
END
$$;
`

export async function POST() {
  try {
    // First verify environment variables
    const envCheck = verifyEnvironmentVariables()
    if (!envCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required environment variables: ${envCheck.missing.join(", ")}`,
        },
        { status: 500 },
      )
    }

    // Try to create an admin client
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (error: any) {
      console.error("Failed to create admin client:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Server configuration error: ${error.message}`,
        },
        { status: 500 },
      )
    }

    // Execute SQL to create tables and policies
    const { error } = await adminClient.rpc("exec_sql", { sql: createTablesSQL })

    if (error) {
      console.error("Error initializing database:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Failed to initialize database: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Unexpected error initializing database:", error)
    return NextResponse.json(
      {
        success: false,
        message: `An unexpected error occurred: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
