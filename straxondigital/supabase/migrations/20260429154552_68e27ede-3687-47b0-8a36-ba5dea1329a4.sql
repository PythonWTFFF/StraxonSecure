
-- 1. Order columns for AI output
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS generated_content JSONB,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. Private storage bucket for deliverables
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files live under {user_id}/{order_id}.pdf
CREATE POLICY "Users read their own deliverables"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'deliverables'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins read all deliverables"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write deliverables"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update deliverables"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'));

-- 3. Auto-trigger generate-deliverable when status -> processing
-- Uses pg_net (already enabled in Supabase) to call the edge function asynchronously.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_generate_deliverable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  function_url TEXT;
BEGIN
  IF NEW.status = 'processing' AND (OLD.status IS DISTINCT FROM 'processing') THEN
    function_url := 'https://vkmcxvjmtkkcyrehrpav.supabase.co/functions/v1/generate-deliverable';
    PERFORM extensions.net.http_post(
      url := function_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('order_id', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_generate_deliverable() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_generate_on_processing ON public.orders;
CREATE TRIGGER orders_generate_on_processing
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_deliverable();
