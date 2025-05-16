-- Add timezone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Pacific Time (UTC-8)';

-- Comment on the column to explain its purpose
COMMENT ON COLUMN public.profiles.timezone IS 'User''s timezone for dream timestamps and notifications'; 