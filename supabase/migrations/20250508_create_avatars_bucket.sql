-- Create the avatars bucket if it doesn't exist
DO $$
BEGIN
    -- Check if the bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
        VALUES ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]);
        
        -- Set up public access policy
        INSERT INTO storage.policies (name, bucket_id, operation, definition)
        VALUES 
            ('Public Read', 'avatars', 'SELECT', '(bucket_id = ''avatars''::text)'),
            ('Avatar Upload', 'avatars', 'INSERT', '(bucket_id = ''avatars''::text)'),
            ('Owner Update', 'avatars', 'UPDATE', '(bucket_id = ''avatars''::text)'),
            ('Owner Delete', 'avatars', 'DELETE', '(bucket_id = ''avatars''::text)');
    END IF;
END $$;
