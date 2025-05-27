import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Direct SQL to create tables without using stored procedures
    const createTablesSQL = `
      -- Create exec_sql function if it doesn't exist
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;

      -- Create profiles table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        full_name TEXT,
        subscription_tier TEXT NOT NULL DEFAULT 'free',
        dreams_count INTEGER NOT NULL DEFAULT 0,
        dreams_limit INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        avatar_url TEXT,
        birthday DATE,
        last_dreams_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );

      -- Create dreams table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.dreams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        interpretation JSONB,
        has_artwork BOOLEAN DEFAULT FALSE,
        has_affirmation BOOLEAN DEFAULT FALSE
      );

      -- Create dream_tags table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.dream_tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dream_id UUID NOT NULL,
        tag TEXT NOT NULL
      );

      -- Create indexes if they don't exist
      CREATE INDEX IF NOT EXISTS dreams_user_id_idx ON public.dreams(user_id);
      CREATE INDEX IF NOT EXISTS dreams_created_at_idx ON public.dreams(created_at);
      CREATE INDEX IF NOT EXISTS dream_tags_dream_id_idx ON public.dream_tags(dream_id);
      CREATE INDEX IF NOT EXISTS dream_tags_tag_idx ON public.dream_tags(tag);

      -- Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.dream_tags ENABLE ROW LEVEL SECURITY;

      -- Create increment function if it doesn't exist
      CREATE OR REPLACE FUNCTION increment(x integer)
      RETURNS integer AS $$
      BEGIN
        RETURN x + 1;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Execute the SQL to create tables
    const { error: createTablesError } = await supabase.rpc('exec_sql', { sql: createTablesSQL })

    if (createTablesError) {
      console.error("Error creating tables:", createTablesError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create database tables",
          error: createTablesError,
        },
        { status: 500 },
      )
    }

    // Create RLS policies
    const createPoliciesSQL = `
      -- Profiles policies
      CREATE POLICY IF NOT EXISTS "Users can view their own profile"
        ON public.profiles FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
        ON public.profiles FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      -- Dreams policies
      CREATE POLICY IF NOT EXISTS "Users can view their own dreams"
        ON public.dreams FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own dreams"
        ON public.dreams FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own dreams"
        ON public.dreams FOR UPDATE
        USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete their own dreams"
        ON public.dreams FOR DELETE
        USING (auth.uid() = user_id);

      -- Dream tags policies
      CREATE POLICY IF NOT EXISTS "Users can view tags for their own dreams"
        ON public.dream_tags FOR SELECT
        USING (
          dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
          )
        );

      CREATE POLICY IF NOT EXISTS "Users can insert tags for their own dreams"
        ON public.dream_tags FOR INSERT
        WITH CHECK (
          dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
          )
        );

      CREATE POLICY IF NOT EXISTS "Users can delete tags for their own dreams"
        ON public.dream_tags FOR DELETE
        USING (
          dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
          )
        );
    `

    // Execute the SQL to create policies
    const { error: createPoliciesError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL })

    if (createPoliciesError) {
      console.error("Error creating policies:", createPoliciesError)
      // Don't return an error here, as the tables were created successfully
      // Just log the error and continue
    }

    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
    })
  } catch (error: any) {
    console.error("Error in init-db route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
