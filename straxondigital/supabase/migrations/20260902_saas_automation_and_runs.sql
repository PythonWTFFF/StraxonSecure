-- ============================================================
-- SAAS AUTOMATION UPGRADE: Automation Runs, Schedules & Client Portals
-- ============================================================

-- ============ AUTOMATION RUNS ============
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- manual | scheduled | webhook
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_content TEXT,
  rag_chunks_used INT NOT NULL DEFAULT 0,
  brand_brain_injected BOOLEAN NOT NULL DEFAULT false,
  tokens_used INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  error_message TEXT,
  webhook_dispatched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their automation runs" ON public.automation_runs
  FOR SELECT USING (
    public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert automation runs" ON public.automation_runs
  FOR INSERT WITH CHECK (
    public.is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Service role can update automation runs" ON public.automation_runs
  FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS automation_runs_workspace_idx ON public.automation_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_runs_status_idx ON public.automation_runs(status);

-- ============ AUTOMATION SCHEDULES ============
CREATE TABLE IF NOT EXISTS public.automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- daily | weekly | monthly
  cron_pattern TEXT, -- e.g. '0 9 * * 1' for weekly Monday 9am
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their automation schedules" ON public.automation_schedules
  FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS automation_schedules_workspace_idx ON public.automation_schedules(workspace_id);
CREATE INDEX IF NOT EXISTS automation_schedules_next_run_idx ON public.automation_schedules(next_run_at) WHERE enabled = true;

-- ============ CLIENT PORTALS (White-Label) ============
CREATE TABLE IF NOT EXISTS public.client_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  retail_price_cents INT NOT NULL DEFAULT 0,
  wholesale_price_cents INT NOT NULL DEFAULT 0,
  deliverable_id UUID REFERENCES public.orders(id),
  custom_message TEXT,
  portal_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  branding_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ,
  access_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their client portals" ON public.client_portals
  FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- Public read via token (for client access - checked in application layer)
CREATE POLICY "Public portal token read" ON public.client_portals
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS client_portals_workspace_idx ON public.client_portals(workspace_id);
CREATE INDEX IF NOT EXISTS client_portals_token_idx ON public.client_portals(portal_token);

-- ============ DOCUMENT METADATA ENHANCEMENT ============
-- Add source_type and title columns to documents for better UX display
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual', -- manual | file_upload | url_scrape
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS char_count INT,
  ADD COLUMN IF NOT EXISTS chunk_index INT NOT NULL DEFAULT 0;

-- ============ WORKSPACE WEBHOOK URL TOKEN ============
-- Each workspace gets a unique inbound webhook token for external triggers
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT DEFAULT encode(gen_random_bytes(16), 'hex');
