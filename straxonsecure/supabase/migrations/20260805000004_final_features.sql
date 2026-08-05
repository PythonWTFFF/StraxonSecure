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

CREATE TABLE IF NOT EXISTS public.ctf_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.ctf_challenges(id) ON DELETE CASCADE NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.ctf_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.ctf_submissions FOR SELECT TO authenticated USING (user_id = auth.uid());


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


-- 3. IR Playbooks Module
CREATE TABLE IF NOT EXISTS public.ir_playbooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  steps jsonb DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.ir_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own or public playbooks" ON public.ir_playbooks FOR SELECT TO authenticated USING (author_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can manage own playbooks" ON public.ir_playbooks FOR ALL TO authenticated USING (author_id = auth.uid());


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
INSERT INTO public.ctf_challenges (title, description, category, flag_hash, points) VALUES
('Baby Web', 'Find the hidden comment in the source code.', 'Web', 'flag{w3b_1s_3asy}', 50),
('SQLi 101', 'Bypass the login prompt using classic SQL injection.', 'Web', 'flag{sql_m4st3r}', 100),
('Reverse Me', 'Reverse engineer the provided binary to find the hardcoded key.', 'Rev', 'flag{r3v_3ng1n33r}', 200),
('Crypto Madness', 'Decrypt the intercepted ciphertext.', 'Crypto', 'flag{cr7pt0_n1nj4}', 150);
