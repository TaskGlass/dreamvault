-- Update subscription tiers and their limits
CREATE OR REPLACE FUNCTION update_subscription_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update free tier (Dreamer Lite) to 5 dreams per month
  UPDATE public.profiles
  SET dreams_limit = 5
  WHERE subscription_tier = 'free';

  -- Update starter tier (Lucid Explorer) to 15 dreams per month
  UPDATE public.profiles
  SET dreams_limit = 15
  WHERE subscription_tier = 'starter';

  -- Update pro tier (Astral Voyager) to 30 dreams per month
  UPDATE public.profiles
  SET dreams_limit = 30
  WHERE subscription_tier = 'pro';
END;
$$;

-- Execute the function
SELECT update_subscription_limits();

-- Drop the function after execution
DROP FUNCTION update_subscription_limits(); 