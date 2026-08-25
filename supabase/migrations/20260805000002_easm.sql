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
