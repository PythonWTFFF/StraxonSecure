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

