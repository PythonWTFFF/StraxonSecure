-- ============================================================
-- STRAXON SECURE - P1 Upgrades (Realtime, Profiles, Posture)
-- ============================================================

-- 1. Profiles Schema Update
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Supabase Realtime for SOC Dashboard
-- soc_events table needs to be in the realtime publication
-- The publication 'supabase_realtime' is created by default in Supabase.
-- We add our table to it so the frontend can receive INSERT events.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'soc_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.soc_events;
  END IF;
END;
$$;

-- 3. Security Posture Scoring RPCs
-- RPC used by labs.ts to award XP for completing labs
CREATE OR REPLACE FUNCTION public.increment_posture_labs(p_user_id UUID, p_points INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.security_posture
  SET xp = xp + p_points,
      labs_completed = labs_completed + 1,
      last_active_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- RPC used by labs.ts to award XP for completing CTF challenges
CREATE OR REPLACE FUNCTION public.increment_posture_ctf(p_user_id UUID, p_points INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.security_posture
  SET xp = xp + p_points,
      last_active_at = now()
  WHERE user_id = p_user_id;
END;
$$;
GRANT ALL ON public.profiles TO service_role;
