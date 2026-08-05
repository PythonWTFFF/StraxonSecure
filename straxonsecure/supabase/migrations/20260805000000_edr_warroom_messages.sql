-- ============================================================
-- STRAXON SECURE — EDR Endpoints & War Room Messages
-- ============================================================

-- ── EDR ENDPOINTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.edr_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  os TEXT NOT NULL DEFAULT 'Unknown',
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','suspicious','compromised','offline')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  agent_version TEXT NOT NULL DEFAULT '1.0.0',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.edr_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY edr_own_all ON public.edr_endpoints FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_edr_endpoints_user ON public.edr_endpoints(user_id, status);

-- ── EDR PROCESS EVENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.edr_process_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES public.edr_endpoints(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  command_line TEXT,
  parent_process TEXT,
  run_as_user TEXT,
  sha256_hash TEXT,
  threat_level TEXT CHECK (threat_level IN ('low','medium','high','critical')),
  ai_analysis TEXT,
  action_taken TEXT CHECK (action_taken IN ('monitored','killed','quarantined','allowed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.edr_process_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY edr_events_own_all ON public.edr_process_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_edr_process_events_user ON public.edr_process_events(user_id, endpoint_id);
CREATE INDEX idx_edr_process_events_threat ON public.edr_process_events(user_id, threat_level);

-- ── WAR ROOM MESSAGES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.warroom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.warroom_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('red','blue','spectator','system')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat','attack','defend','system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warroom_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY wr_msg_select ON public.warroom_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY wr_msg_insert ON public.warroom_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_warroom_messages_session ON public.warroom_messages(session_id, created_at DESC);

-- Enable real-time for war room messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.warroom_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warroom_sessions;
