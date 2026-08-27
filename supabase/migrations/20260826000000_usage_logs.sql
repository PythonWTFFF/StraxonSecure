-- ============================================================
-- STRAXON SECURE - Usage Logs Migration
-- ============================================================
-- Fixes: usage_logs table referenced in src/server/usage.ts
-- but was missing from all previous migrations, causing
-- checkFeatureUsage() to fail silently and bypassing all
-- free-tier quota enforcement.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature      TEXT NOT NULL CHECK (feature IN ('ai_prompt', 'pentest_scan', 'easm_scan', 'code_scan', 'lab_session')),
  details      JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage history
CREATE POLICY usage_logs_select_own
  ON public.usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (used by supabaseAdmin in server functions) retains full access by default.
-- We explicitly GRANT it here for clarity.
GRANT SELECT, INSERT ON public.usage_logs TO service_role;

-- Prevent regular authenticated users from inserting, updating, or deleting usage records
-- directly — all writes must go through the server-side service role client.
REVOKE INSERT, UPDATE, DELETE ON public.usage_logs FROM authenticated, anon;

-- Index for efficient 24-hour usage counting queries used in checkFeatureUsage()
-- Query pattern: WHERE user_id = $1 AND feature = $2 AND created_at >= $3
CREATE INDEX idx_usage_logs_user_feature_time
  ON public.usage_logs (user_id, feature, created_at DESC);
