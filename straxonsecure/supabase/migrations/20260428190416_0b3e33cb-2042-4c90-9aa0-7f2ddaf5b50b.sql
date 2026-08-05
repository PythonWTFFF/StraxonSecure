
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
