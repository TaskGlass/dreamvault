-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    dreams_count INTEGER NOT NULL DEFAULT 0,
    dreams_limit INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    avatar_url TEXT,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.dreams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    interpretation JSONB,
    has_artwork BOOLEAN DEFAULT FALSE,
    has_affirmation BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.dream_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE NOT NULL,
    tag TEXT NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS dreams_user_id_idx ON public.dreams(user_id);
CREATE INDEX IF NOT EXISTS dreams_created_at_idx ON public.dreams(created_at);
CREATE INDEX IF NOT EXISTS dream_tags_dream_id_idx ON public.dream_tags(dream_id);
CREATE INDEX IF NOT EXISTS dream_tags_tag_idx ON public.dream_tags(tag);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Dreams policies
CREATE POLICY "Users can view their own dreams"
    ON public.dreams FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dreams"
    ON public.dreams FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dreams"
    ON public.dreams FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dreams"
    ON public.dreams FOR DELETE
    USING (auth.uid() = user_id);

-- Dream tags policies
CREATE POLICY "Users can view tags for their own dreams"
    ON public.dream_tags FOR SELECT
    USING (
        dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tags for their own dreams"
    ON public.dream_tags FOR INSERT
    WITH CHECK (
        dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tags for their own dreams"
    ON public.dream_tags FOR DELETE
    USING (
        dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
        )
    );

-- Create function to increment counter
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
BEGIN
    RETURN x + 1;
END;
$$ LANGUAGE plpgsql;
