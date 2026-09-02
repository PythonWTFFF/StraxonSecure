-- =====================================================================
-- Migration: Analytics Snapshots, Email Digests, and Client Reports
-- =====================================================================

-- 1. Analytics Snapshots
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mrr_cents BIGINT DEFAULT 0,
  projected_arr_cents BIGINT DEFAULT 0,
  average_deal_cents BIGINT DEFAULT 0,
  active_clients INTEGER DEFAULT 0,
  pipeline_health_score INTEGER DEFAULT 85,
  growth_recommendations JSONB DEFAULT '[]'::jsonb,
  automation_roi JSONB DEFAULT '[]'::jsonb,
  churn_risks JSONB DEFAULT '[]'::jsonb,
  raw_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analytics snapshots"
  ON public.analytics_snapshots
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Email Digests
CREATE TABLE IF NOT EXISTS public.email_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  frequency TEXT DEFAULT 'weekly',
  executive_summary TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  metrics_summary JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'sent', -- 'sent', 'preview', 'failed'
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.email_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their email digests"
  ON public.email_digests
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Client Monthly Reports
CREATE TABLE IF NOT EXISTS public.client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_email TEXT,
  agency_name TEXT DEFAULT 'Straxon Agency Partner',
  agency_logo_url TEXT,
  report_period TEXT NOT NULL, -- e.g. "October 2026"
  share_token TEXT UNIQUE NOT NULL,
  executive_narrative TEXT,
  deliverables_completed INTEGER DEFAULT 0,
  automation_hours_saved NUMERIC(6, 1) DEFAULT 0,
  estimated_content_value_cents BIGINT DEFAULT 0,
  top_achievements JSONB DEFAULT '[]'::jsonb,
  next_month_recommendations JSONB DEFAULT '[]'::jsonb,
  deliverable_items JSONB DEFAULT '[]'::jsonb,
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published', -- 'draft', 'published'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own client reports"
  ON public.client_reports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view client reports by share_token"
  ON public.client_reports
  FOR SELECT
  USING (share_token IS NOT NULL);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user ON public.analytics_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_digests_user ON public.email_digests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_reports_token ON public.client_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_client_reports_user ON public.client_reports(user_id, created_at DESC);
