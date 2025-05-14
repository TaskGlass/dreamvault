-- Add birthday column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- Comment on the column to explain its purpose
COMMENT ON COLUMN public.profiles.birthday IS 'User''s date of birth for horoscope features';
