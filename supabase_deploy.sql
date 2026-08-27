
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- auto create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- lesson progress
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_slug)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_own_select" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lp_own_insert" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lp_own_update" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "lp_own_delete" ON public.lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- architectures
CREATE TABLE public.architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.architectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arch_own_all" ON public.architectures FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- soc events
CREATE TABLE public.soc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  attack_type TEXT NOT NULL,
  source_ip TEXT,
  source_country TEXT,
  source_lat DOUBLE PRECISION,
  source_lng DOUBLE PRECISION,
  target TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.soc_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_select_auth" ON public.soc_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "soc_insert_own" ON public.soc_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "soc_delete_own" ON public.soc_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_soc_events_created ON public.soc_events(created_at DESC);

-- scan results
CREATE TABLE public.scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_own_all" ON public.scan_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Enable realtime for soc_events
ALTER TABLE public.soc_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.soc_events;

-- SUBSCRIPTIONS
CREATE TYPE public.sub_status AS ENUM ('trialing','active','past_due','canceled','expired');
CREATE TYPE public.sub_plan AS ENUM ('free','pro_monthly','pro_yearly');
CREATE TYPE public.sub_provider AS ENUM ('stripe','razorpay','none');

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.sub_plan NOT NULL DEFAULT 'free',
  status public.sub_status NOT NULL DEFAULT 'trialing',
  provider public.sub_provider NOT NULL DEFAULT 'none',
  provider_customer_id text,
  provider_subscription_id text,
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_select_own ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sub_update_own ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sub_insert_own ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider public.sub_provider NOT NULL,
  provider_payment_id text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pay_select_own ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- TEAMS
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8),'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id);
$$;

CREATE POLICY teams_select ON public.teams FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_team_member(id, auth.uid()));
CREATE POLICY teams_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY teams_update_owner ON public.teams FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY teams_delete_owner ON public.teams FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY tm_select ON public.team_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_team_member(team_id, auth.uid()));
CREATE POLICY tm_insert_self ON public.team_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY tm_delete_self ON public.team_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- LEADERBOARD
CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  labs_completed integer NOT NULL DEFAULT 0,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY lb_select_all ON public.leaderboard FOR SELECT TO authenticated USING (true);
CREATE POLICY lb_upsert_own ON public.leaderboard FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY lb_update_own ON public.leaderboard FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- THREAT INTEL CACHE
CREATE TABLE public.threat_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id text NOT NULL UNIQUE,
  severity text,
  cvss_score numeric,
  title text,
  description text,
  published_at timestamptz,
  source_url text,
  cached_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.threat_intel ENABLE ROW LEVEL SECURITY;
CREATE POLICY ti_select_auth ON public.threat_intel FOR SELECT TO authenticated USING (true);

-- COMPLIANCE RUNS
CREATE TABLE public.compliance_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  framework text NOT NULL,
  score integer NOT NULL,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_own_all ON public.compliance_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ACCESS HELPER
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status = 'trialing' AND trial_ends_at > now())
        OR (status = 'active' AND (current_period_end IS NULL OR current_period_end > now()))
      )
  );
$$;

-- TRIAL ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_sub ON auth.users;
CREATE TRIGGER on_auth_user_created_sub
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER sub_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Backfill trial subs for existing users
INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
SELECT id, 'free', 'trialing', now() + interval '7 days' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
-- ============================================================
-- STRAXON SECURE â€” Advanced Platform Migration
-- ============================================================

-- â”€â”€ LAB SESSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.lab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'learning' CHECK (mode IN ('learning','challenge','ctf')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  flags_captured JSONB NOT NULL DEFAULT '[]'::jsonb,
  payloads_tried JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_seconds INTEGER
);
ALTER TABLE public.lab_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ls_own_all ON public.lab_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_lab_sessions_user ON public.lab_sessions(user_id, lab_id);

-- â”€â”€ CTF CHALLENGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.ctf_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('web','crypto','reverse','forensics','network','pwn','misc')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','insane')),
  points INTEGER NOT NULL DEFAULT 100,
  flag_hash TEXT NOT NULL,
  hints JSONB NOT NULL DEFAULT '[]'::jsonb,
  solve_count INTEGER NOT NULL DEFAULT 0,
  max_hints INTEGER NOT NULL DEFAULT 3,
  attachment_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ctf_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY ctf_ch_select ON public.ctf_challenges FOR SELECT TO authenticated USING (is_active = true);

-- â”€â”€ CTF SOLVES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.ctf_solves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  solved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_taken_seconds INTEGER,
  hints_used INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.ctf_solves ENABLE ROW LEVEL SECURITY;
CREATE POLICY ctf_solve_own ON public.ctf_solves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ctf_solve_insert ON public.ctf_solves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- â”€â”€ CTF HINT USAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.ctf_hint_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.ctf_challenges(id) ON DELETE CASCADE,
  hint_index INTEGER NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, hint_index)
);
ALTER TABLE public.ctf_hint_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY ctf_hint_own ON public.ctf_hint_usage FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- â”€â”€ INCIDENT RESPONSE PLAYBOOKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.ir_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  mitre_tactics JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','archived')),
  affected_systems JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ir_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY ir_own_all ON public.ir_playbooks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ir_user ON public.ir_playbooks(user_id, status);

-- â”€â”€ WAR ROOM SESSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.warroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  red_score INTEGER NOT NULL DEFAULT 0,
  blue_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','completed')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  attack_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warroom_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wr_select ON public.warroom_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY wr_insert ON public.warroom_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY wr_update ON public.warroom_sessions FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- â”€â”€ WAR ROOM PARTICIPANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.warroom_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.warroom_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('red','blue','spectator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);
ALTER TABLE public.warroom_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY wrp_select ON public.warroom_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY wrp_insert ON public.warroom_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- â”€â”€ SECURITY POSTURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.security_posture (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  labs_score INTEGER NOT NULL DEFAULT 0,
  soc_score INTEGER NOT NULL DEFAULT 0,
  architecture_score INTEGER NOT NULL DEFAULT 0,
  compliance_score INTEGER NOT NULL DEFAULT 0,
  ctf_score INTEGER NOT NULL DEFAULT 0,
  threat_intel_score INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.security_posture ENABLE ROW LEVEL SECURITY;
CREATE POLICY sp_select_all ON public.security_posture FOR SELECT TO authenticated USING (true);
CREATE POLICY sp_own_upsert ON public.security_posture FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY sp_own_update ON public.security_posture FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- â”€â”€ PACKET CAPTURE SESSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.pcap_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Capture Session',
  packets JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  anomalies_detected INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pcap_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pcap_own ON public.pcap_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- â”€â”€ ACHIEVEMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 50,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','legendary'))
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY ach_select ON public.achievements FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY ua_select_own ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ua_insert_own ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- â”€â”€ ADVANCED SOC EVENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS mitre_tactic TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS mitre_technique TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS ioc_hash TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS raw_payload TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS response_action TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS analyst_notes TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS false_positive BOOLEAN DEFAULT false;

-- â”€â”€ SEED: ACHIEVEMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.achievements (slug, title, description, icon, category, points, rarity) VALUES
  ('first_blood', 'First Blood', 'Complete your first attack lab', 'ðŸ©¸', 'labs', 50, 'common'),
  ('sqli_master', 'SQL Sorcerer', 'Master all SQL injection vectors', 'ðŸ’‰', 'labs', 100, 'uncommon'),
  ('xss_hunter', 'XSS Hunter', 'Execute 5 different XSS payloads', 'ðŸŽ¯', 'labs', 100, 'uncommon'),
  ('jwt_breaker', 'JWT Breaker', 'Break JWT authentication in the JWT lab', 'ðŸ”‘', 'labs', 150, 'rare'),
  ('rce_god', 'RCE God', 'Achieve remote code execution in the RCE lab', 'ðŸ’€', 'labs', 200, 'epic'),
  ('ctf_rookie', 'CTF Rookie', 'Solve your first CTF challenge', 'ðŸš©', 'ctf', 75, 'common'),
  ('flag_collector', 'Flag Collector', 'Capture 10 CTF flags', 'ðŸ´', 'ctf', 200, 'rare'),
  ('soc_operator', 'SOC Operator', 'Block 50 threats in the SOC dashboard', 'ðŸ›¡ï¸', 'soc', 150, 'uncommon'),
  ('architect', 'Security Architect', 'Create a hardened architecture with score 90+', 'ðŸ—ï¸', 'architecture', 200, 'rare'),
  ('red_team_ace', 'Red Team Ace', 'Win a war room session as red team', 'ðŸ”´', 'warroom', 300, 'epic'),
  ('blue_team_guardian', 'Blue Team Guardian', 'Win a war room session as blue team', 'ðŸ”µ', 'warroom', 300, 'epic'),
  ('threat_hunter', 'Threat Hunter', 'Identify 100 CVEs in threat intel', 'ðŸ”', 'intel', 150, 'uncommon'),
  ('compliance_king', 'Compliance King', 'Pass all compliance frameworks', 'ðŸ“‹', 'compliance', 250, 'rare'),
  ('speed_demon', 'Speed Demon', 'Complete a CTF challenge in under 60 seconds', 'âš¡', 'ctf', 400, 'legendary'),
  ('dark_knight', 'Dark Knight', 'Reach level 10', 'ðŸ¦‡', 'general', 500, 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- â”€â”€ SEED: CTF CHALLENGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.ctf_challenges (slug, title, description, category, difficulty, points, flag_hash, hints) VALUES
  (
    'web-01-cookie-monster',
    'Cookie Monster',
    'A login page stores user role in a cookie. Can you escalate your privileges to admin? The flag is hidden in the admin dashboard.',
    'web', 'easy', 100,
    'straxon{c00k1e_m4n1pul4t10n_1s_d4ng3r0us}',
    '[{"index":0,"text":"Inspect your browser cookies after logging in"},{"index":1,"text":"The role field seems suspiciously editable"},{"index":2,"text":"Try changing role=user to role=admin"}]'::jsonb
  ),
  (
    'web-02-jwt-confusion',
    'Algorithm Confusion',
    'The API uses JWT tokens for authentication. The developer made a critical mistake in their JWT validation. Forge a token as admin.',
    'web', 'medium', 200,
    'straxon{4lg_n0n3_4tt4ck_byp4ss3d}',
    '[{"index":0,"text":"Look at the alg field in the JWT header"},{"index":1,"text":"Try setting alg to none"},{"index":2,"text":"An unsigned token with alg:none might be accepted"}]'::jsonb
  ),
  (
    'web-03-ssrf-internal',
    'Internal Recon',
    'The web app fetches URLs from user input. Can you make it fetch from the internal network? The flag server runs on http://169.254.169.254/flag',
    'web', 'medium', 250,
    'straxon{ssrf_l34ds_t0_m3t4d4t4_l34k}',
    '[{"index":0,"text":"The /fetch endpoint takes a url parameter"},{"index":1,"text":"Try cloud metadata endpoints"},{"index":2,"text":"AWS/GCP metadata: 169.254.169.254"}]'::jsonb
  ),
  (
    'crypto-01-xor-cipher',
    'XOR Secrets',
    'A file has been encrypted with a single-byte XOR cipher. The key is a printable ASCII character. Decrypt the message to find the flag.',
    'crypto', 'easy', 100,
    'straxon{x0r_1s_n0t_3ncrypt10n}',
    '[{"index":0,"text":"Single byte XOR means there are only 256 possible keys"},{"index":1,"text":"Brute force all 256 keys"},{"index":2,"text":"The decrypted text will be readable English"}]'::jsonb
  ),
  (
    'crypto-02-weak-rsa',
    'Tiny Exponent',
    'RSA was used with e=3. Small plaintext messages with tiny exponents are vulnerable. Recover the flag from the provided ciphertext.',
    'crypto', 'hard', 400,
    'straxon{sm4ll_3xp0n3nt_4tt4ck_rsa}',
    '[{"index":0,"text":"When e=3 and message is small, cube root of ciphertext might equal the message"},{"index":1,"text":"Try taking the integer cube root of ciphertext mod n"},{"index":2,"text":"If message^e < n, then ciphertext = message^e (no modular reduction)"}]'::jsonb
  ),
  (
    'network-01-pcap-analysis',
    'Traffic Analysis',
    'A network capture file contains suspicious activity. Analyze the packets and find the exfiltrated secret hidden in the data stream.',
    'network', 'medium', 200,
    'straxon{dns_3xfil_1s_stealthy}',
    '[{"index":0,"text":"Look at DNS queries â€” they can carry data"},{"index":1,"text":"Check for unusually long subdomain names"},{"index":2,"text":"The flag is base64 encoded in DNS TXT records"}]'::jsonb
  ),
  (
    'misc-01-steganography',
    'Hidden in Plain Sight',
    'An innocent-looking image contains a hidden message. Extract the flag using steganography techniques.',
    'misc', 'easy', 150,
    'straxon{l35t_s1gn1f1c4nt_b1t_st3g4n0}',
    '[{"index":0,"text":"Check the LSB (Least Significant Bit) of pixel values"},{"index":1,"text":"The message is hidden in the red channel LSBs"},{"index":2,"text":"Read bits sequentially, convert to ASCII"}]'::jsonb
  ),
  (
    'forensics-01-log-analysis',
    'Log Hunter',
    'A server was compromised. Analyze the access logs to identify the attacker''s IP, the vulnerability exploited, and the timestamp. Format: straxon{IP_VULN_TIMESTAMP}',
    'forensics', 'medium', 300,
    'straxon{192.168.1.105_SQLi_2026-08-01T14:23:07}',
    '[{"index":0,"text":"Look for unusual URL patterns in GET/POST requests"},{"index":1,"text":"SQL injection leaves distinct patterns like UNION SELECT"},{"index":2,"text":"The first successful injection is your timestamp"}]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- â”€â”€ HELPER: init posture for new user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.init_user_posture()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.security_posture (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_posture ON auth.users;
CREATE TRIGGER on_auth_user_posture
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.init_user_posture();

-- Backfill for existing users
INSERT INTO public.security_posture (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- â”€â”€ UPDATED_AT TRIGGERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TRIGGER ir_touch BEFORE UPDATE ON public.ir_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER sp_touch BEFORE UPDATE ON public.security_posture
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
-- ============================================================
-- STRAXON SECURE â€” Supplemental Migration v2
-- Adds scan_results table + compliance_runs + profiles fixes
-- ============================================================

-- â”€â”€ SCAN RESULTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL DEFAULT 'unknown',
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
-- Policy already exists in previous migration
CREATE INDEX idx_scan_results_user ON public.scan_results(user_id);

-- â”€â”€ COMPLIANCE RUNS (if not present) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.compliance_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  checks_passed INTEGER NOT NULL DEFAULT 0,
  checks_failed INTEGER NOT NULL DEFAULT 0,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_runs ENABLE ROW LEVEL SECURITY;
-- Policy already exists in previous migration
CREATE INDEX idx_compliance_runs_user ON public.compliance_runs(user_id, framework);

-- â”€â”€ PROFILES (if not present) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github TEXT,
  website TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Policies already exist in previous migration

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.init_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_profile ON auth.users;
CREATE TRIGGER on_auth_user_profile
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.init_user_profile();

-- Backfill
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- â”€â”€ ARCHITECTURES (ensure exists for posture scoring) â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Architecture',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  security_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.architectures ENABLE ROW LEVEL SECURITY;
-- Policy already exists in previous migration
-- Project Titan Advanced Database Mechanics

-- 1. Automated Streak Updating Trigger
-- When a user completes a lab or captures a CTF flag, update their streak.

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_active TIMESTAMP;
    current_streak INT;
BEGIN
    SELECT last_active_at, streak_days INTO last_active, current_streak
    FROM security_posture
    WHERE user_id = NEW.user_id;

    IF last_active IS NULL THEN
        UPDATE security_posture SET streak_days = 1, last_active_at = now() WHERE user_id = NEW.user_id;
    ELSIF last_active < now() - INTERVAL '1 day' AND last_active > now() - INTERVAL '2 days' THEN
        UPDATE security_posture SET streak_days = current_streak + 1, last_active_at = now() WHERE user_id = NEW.user_id;
    ELSIF last_active < now() - INTERVAL '2 days' THEN
        UPDATE security_posture SET streak_days = 1, last_active_at = now() WHERE user_id = NEW.user_id;
    ELSE
        -- Same day, just update last active
        UPDATE security_posture SET last_active_at = now() WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ctf_solve_streak ON ctf_solves;
CREATE TRIGGER trg_ctf_solve_streak
AFTER INSERT ON ctf_solves
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

DROP TRIGGER IF EXISTS trg_lab_session_streak ON lab_sessions;
CREATE TRIGGER trg_lab_session_streak
AFTER UPDATE ON lab_sessions
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION update_user_streak();

-- 2. Materialized View for Global Leaderboard
-- To optimize fetching the leaderboard for thousands of users

DROP MATERIALIZED VIEW IF EXISTS mv_global_leaderboard CASCADE;
CREATE MATERIALIZED VIEW mv_global_leaderboard AS
SELECT 
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    p.total_score,
    p.level,
    p.streak_days,
    p.badges,
    RANK() OVER (ORDER BY p.total_score DESC, p.updated_at ASC) as global_rank
FROM security_posture p
LEFT JOIN profiles pr ON p.user_id = pr.id;

CREATE UNIQUE INDEX idx_mv_global_leaderboard_user_id ON mv_global_leaderboard (user_id);
CREATE INDEX idx_mv_global_leaderboard_rank ON mv_global_leaderboard (global_rank);

-- 3. Function to refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_mv_global_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_leaderboard;
END;
$$ LANGUAGE plpgsql;
-- ============================================================
-- STRAXON SECURE â€” EDR Endpoints & War Room Messages
-- ============================================================

-- â”€â”€ EDR ENDPOINTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ EDR PROCESS EVENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ WAR ROOM MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
-- Developer API & Webhooks Engine Migration

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
ON public.api_keys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
ON public.api_keys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
ON public.api_keys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 2. Webhooks Table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
ON public.webhooks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhooks"
ON public.webhooks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
ON public.webhooks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
ON public.webhooks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Expose Realtime for webhooks just in case
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhooks;
-- EASM (External Attack Surface Management) Migration

CREATE TABLE IF NOT EXISTS public.easm_targets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'completed', 'failed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, domain)
);

ALTER TABLE public.easm_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own EASM targets"
ON public.easm_targets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own EASM targets"
ON public.easm_targets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own EASM targets"
ON public.easm_targets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own EASM targets"
ON public.easm_targets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.easm_findings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id uuid REFERENCES public.easm_targets(id) ON DELETE CASCADE NOT NULL,
  finding_type text NOT NULL CHECK (finding_type IN ('subdomain', 'open_port', 'leak', 'dns_record')),
  value text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  details jsonb DEFAULT '{}'::jsonb,
  discovered_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(target_id, finding_type, value)
);

ALTER TABLE public.easm_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view EASM findings of their targets"
ON public.easm_findings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.easm_targets t
    WHERE t.id = easm_findings.target_id AND t.user_id = auth.uid()
  )
);

-- Note: In a real system, a backend service account inserts findings.
-- For TanStack Start server functions using supabaseAdmin (Service Role), RLS is bypassed during INSERT.
-- Executive Reports Migration

CREATE TABLE IF NOT EXISTS public.report_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  frequency text DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  emails text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report schedules"
ON public.report_schedules FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report schedules"
ON public.report_schedules FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report schedules"
ON public.report_schedules FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report schedules"
ON public.report_schedules FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
-- 1. CTF Module
CREATE TABLE IF NOT EXISTS public.ctf_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 100,
  category text NOT NULL,
  flag_hash text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.ctf_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view CTF challenges" ON public.ctf_challenges FOR SELECT TO authenticated USING (true);

-- 1. CTF Module (ctf_solves already exists in previous migration)

-- 2. War Room Module
CREATE TABLE IF NOT EXISTS public.warroom_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  scenario text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.warroom_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all warrooms" ON public.warroom_sessions FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.warroom_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.warroom_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.warroom_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view warroom messages" ON public.warroom_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert warroom messages" ON public.warroom_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());


-- 3. IR Playbooks Module (Extend existing table instead of re-creating to prevent conflict)
ALTER TABLE public.ir_playbooks ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add new policies for the updated table structure
CREATE POLICY "Users can view their own or public playbooks" ON public.ir_playbooks FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_public = true);


-- 4. Packet Analyzer Module
CREATE TABLE IF NOT EXISTS public.packet_scans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  size_bytes integer NOT NULL,
  analysis_results jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.packet_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own packet scans" ON public.packet_scans FOR SELECT TO authenticated USING (user_id = auth.uid());


-- 5. PTaaS (Pentest) Module
CREATE TABLE IF NOT EXISTS public.pentest_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target text NOT NULL,
  mode text NOT NULL,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  risk_level text,
  ai_report text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.pentest_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pentest jobs" ON public.pentest_jobs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 6. Posture Management Module
CREATE TABLE IF NOT EXISTS public.posture_evaluations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cloud_provider text NOT NULL,
  score integer NOT NULL,
  findings jsonb NOT NULL,
  evaluated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.posture_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own posture evals" ON public.posture_evaluations FOR SELECT TO authenticated USING (user_id = auth.uid());

-- INSERT INITIAL CTF CHALLENGES
INSERT INTO public.ctf_challenges (slug, title, description, category, difficulty, flag_hash, points) VALUES
('baby-web', 'Baby Web', 'Find the hidden comment in the source code.', 'web', 'easy', 'flag{w3b_1s_3asy}', 50),
('sqli-101', 'SQLi 101', 'Bypass the login prompt using classic SQL injection.', 'web', 'medium', 'flag{sql_m4st3r}', 100),
('reverse-me', 'Reverse Me', 'Reverse engineer the provided binary to find the hardcoded key.', 'reverse', 'hard', 'flag{r3v_3ng1n33r}', 200),
('crypto-madness', 'Crypto Madness', 'Decrypt the intercepted ciphertext.', 'crypto', 'medium', 'flag{cr7pt0_n1nj4}', 150)
ON CONFLICT (slug) DO NOTHING;

-- Update soc_events with missing columns
ALTER TABLE public.soc_events
ADD COLUMN IF NOT EXISTS mitre_tactic TEXT,
ADD COLUMN IF NOT EXISTS mitre_technique TEXT,
ADD COLUMN IF NOT EXISTS raw_payload TEXT,
ADD COLUMN IF NOT EXISTS ioc_hash TEXT,
ADD COLUMN IF NOT EXISTS false_positive BOOLEAN DEFAULT false;


-- Update ctf_challenges
ALTER TABLE public.ctf_challenges
ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS max_hints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS solve_count INTEGER DEFAULT 0;

-- Create ctf_hint_usage
CREATE TABLE IF NOT EXISTS public.ctf_hint_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.ctf_challenges(id) ON DELETE CASCADE NOT NULL,
  hint_index integer NOT NULL,
  used_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, challenge_id, hint_index)
);

-- Create leads moved to saas_leads migration

-- Create lab_sessions
CREATE TABLE IF NOT EXISTS public.lab_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lab_id text NOT NULL,
  container_id text,
  container_ip text,
  container_port integer,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);


-- Create edr_endpoints
CREATE TABLE IF NOT EXISTS public.edr_endpoints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hostname text NOT NULL,
  os text NOT NULL,
  ip_address text NOT NULL,
  agent_version text NOT NULL,
  status text DEFAULT 'healthy' NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb NOT NULL,
  last_seen timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create edr_process_events
CREATE TABLE IF NOT EXISTS public.edr_process_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint_id uuid REFERENCES public.edr_endpoints(id) ON DELETE CASCADE NOT NULL,
  process_name text NOT NULL,
  command_line text,
  parent_process text,
  run_as_user text,
  sha256_hash text,
  threat_level text NOT NULL,
  ai_analysis text,
  action_taken text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create api_keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create webhooks
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Update soc_events with missing response_action and analyst_notes
ALTER TABLE public.soc_events
ADD COLUMN IF NOT EXISTS response_action text,
ADD COLUMN IF NOT EXISTS analyst_notes text;



ALTER TABLE public.lab_sessions ADD COLUMN IF NOT EXISTS score integer, ADD COLUMN IF NOT EXISTS flags_captured text[];

-- Migration for SaaS leads/marketing capture
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT,
    company TEXT,
    interest TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (allow public inserts, but only admins can read)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to leads"
    ON leads FOR INSERT
    WITH CHECK (true);

-- Only service role can select leads
CREATE POLICY "Allow service role select leads"
    ON leads FOR SELECT
    USING (true);
-- Add this to your Supabase SQL Editor to enable Webhook Integrations

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slack_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Removed insecure INSERT policy as inserts are handled via backend service role
DROP POLICY IF EXISTS "Users can insert own pentest jobs" ON public.pentest_jobs;

-- 3. Webhooks Table
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own webhooks"
    ON public.webhooks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own webhooks"
    ON public.webhooks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_payment_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
    ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Usage Logs Table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage logs"
    ON public.usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);
-- Immutable audit trail for SSR server-function-level security events.
-- Append-only by design: no update/delete grants for the application role.
create table if not exists public.audit_log (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),
  request_id    text not null,
  actor_user_id uuid not null references auth.users(id),
  org_id        uuid not null,
  action        text not null,        -- e.g. 'pentest.launch'
  target        text,                 -- e.g. the scanned URL
  server_fn     text not null,        -- e.g. 'launchPentest'
  ip_address    inet,
  metadata      jsonb not null default '{}'::jsonb
);

alter table public.audit_log enable row level security;

-- read_own_org policy: assumes users have an 'org_id' in their app_metadata or raw_user_meta_data.
-- Note: adjust (auth.jwt() ->> 'org_id')::uuid to your specific token schema.
create policy audit_log_read_own_org
  on public.audit_log for select
  to authenticated
  using (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- inserts happen only through a server-role logging helper (Service Role Key) â€” never client-writable
revoke update, delete on public.audit_log from authenticated, anon;
revoke insert on public.audit_log from authenticated, anon;
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
-- directly â€” all writes must go through the server-side service role client.
REVOKE INSERT, UPDATE, DELETE ON public.usage_logs FROM authenticated, anon;

-- Index for efficient 24-hour usage counting queries used in checkFeatureUsage()
-- Query pattern: WHERE user_id = $1 AND feature = $2 AND created_at >= $3
CREATE INDEX idx_usage_logs_user_feature_time
  ON public.usage_logs (user_id, feature, created_at DESC);
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
