
-- 1. Extend service_type enum
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'social';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'adcopy';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'email';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'chatbot';

-- 2. Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all invoices"
  ON public.invoices FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update invoices"
  ON public.invoices FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1000;

-- 4. Auto-create invoice on new order
CREATE OR REPLACE FUNCTION public.create_invoice_for_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num INT;
  v_year TEXT;
  v_tax INTEGER;
BEGIN
  v_num := nextval('public.invoice_seq');
  v_year := to_char(now(), 'YYYY');
  -- 8% default tax
  v_tax := ROUND(NEW.price_cents * 0.08);
  INSERT INTO public.invoices (order_id, user_id, invoice_number, amount_cents, tax_cents, total_cents, status)
  VALUES (
    NEW.id,
    NEW.user_id,
    'INV-' || v_year || '-' || lpad(v_num::text, 4, '0'),
    NEW.price_cents,
    v_tax,
    NEW.price_cents + v_tax,
    'pending'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_create_invoice ON public.orders;
CREATE TRIGGER orders_create_invoice
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_invoice_for_order();

-- 5. Mark invoice paid when order completes
CREATE OR REPLACE FUNCTION public.mark_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.invoices
      SET status = 'paid', updated_at = now()
      WHERE order_id = NEW.id AND status <> 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_mark_invoice_paid ON public.orders;
CREATE TRIGGER orders_mark_invoice_paid
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.mark_invoice_paid();

-- 6. Updated-at touch
DROP TRIGGER IF EXISTS invoices_touch ON public.invoices;
CREATE TRIGGER invoices_touch
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. Backfill invoices for existing orders
INSERT INTO public.invoices (order_id, user_id, invoice_number, amount_cents, tax_cents, total_cents, status)
SELECT
  o.id, o.user_id,
  'INV-' || to_char(o.created_at, 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0'),
  o.price_cents,
  ROUND(o.price_cents * 0.08),
  o.price_cents + ROUND(o.price_cents * 0.08),
  CASE WHEN o.status = 'completed' THEN 'paid' ELSE 'pending' END
FROM public.orders o
LEFT JOIN public.invoices i ON i.order_id = o.id
WHERE i.id IS NULL;
