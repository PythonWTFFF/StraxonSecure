-- ============================================================
-- ADVANCED SAAS PIPELINES, AGENCY LEAD CAPTURE & PORTAL FEEDBACK
-- ============================================================

-- ============ AGENCY LEADS (Embeddable Lead Magnet Capture) ============
CREATE TABLE IF NOT EXISTS public.agency_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_name TEXT,
  lead_email TEXT NOT NULL,
  lead_website TEXT,
  audit_score INT,
  audit_grade TEXT,
  audit_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | converted | archived
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their agency leads" ON public.agency_leads
  FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- Allow public insertion (e.g. from embedded widget)
CREATE POLICY "Public widget can insert agency leads" ON public.agency_leads
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS agency_leads_workspace_idx ON public.agency_leads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agency_leads_status_idx ON public.agency_leads(status);

-- ============ PORTAL FEEDBACK (Client Revision Requests & Approvals) ============
CREATE TABLE IF NOT EXISTS public.portal_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  feedback_type TEXT NOT NULL DEFAULT 'revision', -- revision | approval | general
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread', -- unread | acknowledged | resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit portal feedback" ON public.portal_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their portal feedback" ON public.portal_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_portals cp
      WHERE cp.id = portal_feedback.portal_id
      AND (public.is_workspace_member(cp.workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can update their portal feedback" ON public.portal_feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.client_portals cp
      WHERE cp.id = portal_feedback.portal_id
      AND (public.is_workspace_member(cp.workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE INDEX IF NOT EXISTS portal_feedback_portal_idx ON public.portal_feedback(portal_id, created_at DESC);

-- ============ AUTOMATION PIPELINES (Autonomous Multi-Step AI Chains) ============
CREATE TABLE IF NOT EXISTS public.automation_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_name TEXT NOT NULL,
  pipeline_type TEXT NOT NULL, -- gtm-launchpad | seo-authority-blitz | cold-outreach-engine | voice-agent-deploy
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  step_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  compiled_deliverable TEXT,
  rag_chunks_used INT NOT NULL DEFAULT 0,
  tokens_used INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.automation_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their automation pipelines" ON public.automation_pipelines
  FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS automation_pipelines_workspace_idx ON public.automation_pipelines(workspace_id, created_at DESC);
