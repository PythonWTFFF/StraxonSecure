-- ============================================================
-- STRAXON SECURE — Advanced Platform Migration
-- ============================================================

-- ── LAB SESSIONS ──────────────────────────────────────────
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

-- ── CTF CHALLENGES ────────────────────────────────────────
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

-- ── CTF SOLVES ────────────────────────────────────────────
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

-- ── CTF HINT USAGE ────────────────────────────────────────
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

-- ── INCIDENT RESPONSE PLAYBOOKS ───────────────────────────
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

-- ── WAR ROOM SESSIONS ─────────────────────────────────────
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

-- ── WAR ROOM PARTICIPANTS ─────────────────────────────────
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

-- ── SECURITY POSTURE ──────────────────────────────────────
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

-- ── PACKET CAPTURE SESSIONS ───────────────────────────────
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

-- ── ACHIEVEMENTS ──────────────────────────────────────────
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

-- ── ADVANCED SOC EVENTS ───────────────────────────────────
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS mitre_tactic TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS mitre_technique TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS ioc_hash TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS raw_payload TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS response_action TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS analyst_notes TEXT;
ALTER TABLE public.soc_events ADD COLUMN IF NOT EXISTS false_positive BOOLEAN DEFAULT false;

-- ── SEED: ACHIEVEMENTS ────────────────────────────────────
INSERT INTO public.achievements (slug, title, description, icon, category, points, rarity) VALUES
  ('first_blood', 'First Blood', 'Complete your first attack lab', '🩸', 'labs', 50, 'common'),
  ('sqli_master', 'SQL Sorcerer', 'Master all SQL injection vectors', '💉', 'labs', 100, 'uncommon'),
  ('xss_hunter', 'XSS Hunter', 'Execute 5 different XSS payloads', '🎯', 'labs', 100, 'uncommon'),
  ('jwt_breaker', 'JWT Breaker', 'Break JWT authentication in the JWT lab', '🔑', 'labs', 150, 'rare'),
  ('rce_god', 'RCE God', 'Achieve remote code execution in the RCE lab', '💀', 'labs', 200, 'epic'),
  ('ctf_rookie', 'CTF Rookie', 'Solve your first CTF challenge', '🚩', 'ctf', 75, 'common'),
  ('flag_collector', 'Flag Collector', 'Capture 10 CTF flags', '🏴', 'ctf', 200, 'rare'),
  ('soc_operator', 'SOC Operator', 'Block 50 threats in the SOC dashboard', '🛡️', 'soc', 150, 'uncommon'),
  ('architect', 'Security Architect', 'Create a hardened architecture with score 90+', '🏗️', 'architecture', 200, 'rare'),
  ('red_team_ace', 'Red Team Ace', 'Win a war room session as red team', '🔴', 'warroom', 300, 'epic'),
  ('blue_team_guardian', 'Blue Team Guardian', 'Win a war room session as blue team', '🔵', 'warroom', 300, 'epic'),
  ('threat_hunter', 'Threat Hunter', 'Identify 100 CVEs in threat intel', '🔍', 'intel', 150, 'uncommon'),
  ('compliance_king', 'Compliance King', 'Pass all compliance frameworks', '📋', 'compliance', 250, 'rare'),
  ('speed_demon', 'Speed Demon', 'Complete a CTF challenge in under 60 seconds', '⚡', 'ctf', 400, 'legendary'),
  ('dark_knight', 'Dark Knight', 'Reach level 10', '🦇', 'general', 500, 'legendary')
ON CONFLICT (slug) DO NOTHING;

-- ── SEED: CTF CHALLENGES ──────────────────────────────────
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
    '[{"index":0,"text":"Look at DNS queries — they can carry data"},{"index":1,"text":"Check for unusually long subdomain names"},{"index":2,"text":"The flag is base64 encoded in DNS TXT records"}]'::jsonb
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

-- ── HELPER: init posture for new user ─────────────────────
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

-- ── UPDATED_AT TRIGGERS ───────────────────────────────────
CREATE TRIGGER ir_touch BEFORE UPDATE ON public.ir_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER sp_touch BEFORE UPDATE ON public.security_posture
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
