
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.workspace_role AS ENUM ('owner','admin','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'needs_revision';

-- ============ WORKSPACES ============
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.workspace_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_users WHERE workspace_id = _ws AND user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(_ws UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE workspace_id = _ws AND user_id = _user AND role IN ('owner','admin')
  )
$$;

-- Policies: workspaces
DROP POLICY IF EXISTS "Members view workspaces" ON public.workspaces;
CREATE POLICY "Members view workspaces" ON public.workspaces FOR SELECT
USING (public.is_workspace_member(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Owners update workspaces" ON public.workspaces;
CREATE POLICY "Owners update workspaces" ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Users create workspaces" ON public.workspaces;
CREATE POLICY "Users create workspaces" ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners delete workspaces" ON public.workspaces;
CREATE POLICY "Owners delete workspaces" ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- Policies: workspace_users
DROP POLICY IF EXISTS "Members view workspace_users" ON public.workspace_users;
CREATE POLICY "Members view workspace_users" ON public.workspace_users FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage workspace_users" ON public.workspace_users;
CREATE POLICY "Admins manage workspace_users" ON public.workspace_users FOR ALL
USING (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);

-- ============ BRAND BRAIN ============
CREATE TABLE IF NOT EXISTS public.brand_brain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_name TEXT,
  mission TEXT,
  audience TEXT,
  -- tone sliders 0-100
  tone_professional INT NOT NULL DEFAULT 50,
  tone_playful INT NOT NULL DEFAULT 50,
  tone_bold INT NOT NULL DEFAULT 50,
  tone_warm INT NOT NULL DEFAULT 50,
  palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  dos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  donts TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  reference_links TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_configured BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_brain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view brand_brain" ON public.brand_brain;
CREATE POLICY "Members view brand_brain" ON public.brand_brain FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins write brand_brain" ON public.brand_brain;
CREATE POLICY "Admins write brand_brain" ON public.brand_brain FOR ALL
USING (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- ============ WORKSPACE INTEGRATIONS ============
CREATE TABLE IF NOT EXISTS public.workspace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view integrations" ON public.workspace_integrations;
CREATE POLICY "Members view integrations" ON public.workspace_integrations FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage integrations" ON public.workspace_integrations;
CREATE POLICY "Admins manage integrations" ON public.workspace_integrations FOR ALL
USING (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- ============ ORDERS: revisions, share, workspace ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS workspace_id UUID,
  ADD COLUMN IF NOT EXISTS revisions_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revision_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_share_token ON public.orders(share_token);
CREATE INDEX IF NOT EXISTS idx_orders_workspace ON public.orders(workspace_id);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- ============ BACKFILL: personal workspace per existing user ============
DO $$
DECLARE
  r RECORD;
  ws_id UUID;
  ws_name TEXT;
BEGIN
  FOR r IN
    SELECT p.id AS user_id, COALESCE(NULLIF(p.full_name,''), split_part(COALESCE(p.email,'My'),'@',1)) AS display_name
    FROM public.profiles p
    LEFT JOIN public.workspace_users wu ON wu.user_id = p.id
    WHERE wu.id IS NULL
  LOOP
    ws_name := COALESCE(r.display_name, 'My') || '''s workspace';
    INSERT INTO public.workspaces (name, owner_id) VALUES (ws_name, r.user_id) RETURNING id INTO ws_id;
    INSERT INTO public.workspace_users (workspace_id, user_id, role) VALUES (ws_id, r.user_id, 'owner');
    INSERT INTO public.brand_brain (workspace_id, brand_name) VALUES (ws_id, ws_name);
    -- backfill orders + invoices
    UPDATE public.orders SET workspace_id = ws_id WHERE user_id = r.user_id AND workspace_id IS NULL;
    UPDATE public.invoices SET workspace_id = ws_id WHERE user_id = r.user_id AND workspace_id IS NULL;
  END LOOP;
END $$;

-- ============ Updated handle_new_user: create workspace too ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ws_id UUID;
  ws_name TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');

  ws_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), split_part(NEW.email,'@',1)) || '''s workspace';
  INSERT INTO public.workspaces (name, owner_id) VALUES (ws_name, NEW.id) RETURNING id INTO ws_id;
  INSERT INTO public.workspace_users (workspace_id, user_id, role) VALUES (ws_id, NEW.id, 'owner');
  INSERT INTO public.brand_brain (workspace_id, brand_name) VALUES (ws_id, ws_name);
  RETURN NEW;
END;
$$;

-- ============ Order RLS additions: workspace + public ============
DROP POLICY IF EXISTS "Workspace members view orders" ON public.orders;
CREATE POLICY "Workspace members view orders" ON public.orders FOR SELECT
USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Public view of shared orders" ON public.orders;
CREATE POLICY "Public view of shared orders" ON public.orders FOR SELECT
TO anon, authenticated
USING (is_public = true);

DROP POLICY IF EXISTS "Workspace members view invoices" ON public.invoices;
CREATE POLICY "Workspace members view invoices" ON public.invoices FOR SELECT
USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));

-- ============ Default workspace_id on new orders/invoices ============
CREATE OR REPLACE FUNCTION public.set_order_workspace()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT id INTO NEW.workspace_id FROM public.workspaces WHERE owner_id = NEW.user_id ORDER BY created_at ASC LIMIT 1;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_order_workspace ON public.orders;
CREATE TRIGGER trg_set_order_workspace BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_workspace();

CREATE OR REPLACE FUNCTION public.set_invoice_workspace()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id FROM public.orders WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_invoice_workspace ON public.invoices;
CREATE TRIGGER trg_set_invoice_workspace BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_workspace();

-- updated_at touch
DROP TRIGGER IF EXISTS trg_brand_brain_touch ON public.brand_brain;
CREATE TRIGGER trg_brand_brain_touch BEFORE UPDATE ON public.brand_brain
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_touch ON public.workspaces;
CREATE TRIGGER trg_workspaces_touch BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
