-- Enable UUID extension
CREATE OR REPLACE FUNCTION enable_uuid_extension()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
END;
$$;

-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(p_table text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = p_table
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION check_column_exists(p_table text, p_column text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = p_table
    AND column_name = p_column
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- Create profiles table
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    subscription_tier TEXT DEFAULT 'free',
    dreams_count INTEGER DEFAULT 0,
    dreams_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
  );
END;
$$;

-- Create dreams table
CREATE OR REPLACE FUNCTION create_dreams_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS dreams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    interpretation JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    has_artwork BOOLEAN DEFAULT FALSE,
    has_affirmation BOOLEAN DEFAULT FALSE,
    artwork_url TEXT
  );
END;
$$;

-- Create dream_tags table
CREATE OR REPLACE FUNCTION create_dream_tags_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS dream_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
  );
END;
$$;

-- Create indexes
CREATE OR REPLACE FUNCTION create_indexes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams(user_id);
  CREATE INDEX IF NOT EXISTS idx_dream_tags_dream_id ON dream_tags(dream_id);
  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
END;
$$;

-- Enable Row Level Security
CREATE OR REPLACE FUNCTION enable_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
  ALTER TABLE dream_tags ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Create policies
CREATE OR REPLACE FUNCTION create_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view their own dreams" ON dreams;
  DROP POLICY IF EXISTS "Users can create their own dreams" ON dreams;
  DROP POLICY IF EXISTS "Users can update their own dreams" ON dreams;
  DROP POLICY IF EXISTS "Users can delete their own dreams" ON dreams;
  DROP POLICY IF EXISTS "Users can view their own dream tags" ON dream_tags;
  DROP POLICY IF EXISTS "Users can create their own dream tags" ON dream_tags;
  DROP POLICY IF EXISTS "Users can delete their own dream tags" ON dream_tags;

  -- Create new policies
  CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own dreams" ON dreams
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own dreams" ON dreams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own dreams" ON dreams
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own dreams" ON dreams
    FOR DELETE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own dream tags" ON dream_tags
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM dreams
        WHERE dreams.id = dream_tags.dream_id
        AND dreams.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can create their own dream tags" ON dream_tags
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM dreams
        WHERE dreams.id = dream_tags.dream_id
        AND dreams.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can delete their own dream tags" ON dream_tags
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM dreams
        WHERE dreams.id = dream_tags.dream_id
        AND dreams.user_id = auth.uid()
      )
    );
END;
$$; 