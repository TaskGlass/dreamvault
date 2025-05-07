-- Add artwork_url column to dreams table
ALTER TABLE public.dreams ADD COLUMN IF NOT EXISTS artwork_url TEXT;

-- Create dream_shares table
CREATE TABLE IF NOT EXISTS public.dream_shares (
    id TEXT PRIMARY KEY,
    dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE,
    share_type TEXT NOT NULL,
    content TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Shared Dream',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    views INTEGER DEFAULT 0 NOT NULL
);

-- Create index on dream_id
CREATE INDEX IF NOT EXISTS dream_shares_dream_id_idx ON public.dream_shares(dream_id);

-- Enable RLS on dream_shares
ALTER TABLE public.dream_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dream_shares
CREATE POLICY "Anyone can view shared content"
    ON public.dream_shares FOR SELECT
    USING (true);

CREATE POLICY "Users can create shares for their own dreams"
    ON public.dream_shares FOR INSERT
    WITH CHECK (
        dream_id IS NULL OR
        dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own shares"
    ON public.dream_shares FOR UPDATE
    USING (
        dream_id IS NULL OR
        dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own shares"
    ON public.dream_shares FOR DELETE
    USING (
        dream_id IS NULL OR
        dream_id IN (
            SELECT id FROM public.dreams WHERE user_id = auth.uid()
        )
    );
