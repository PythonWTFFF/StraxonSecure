-- Support ticket categories & status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  order_id UUID,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  status public.ticket_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a ticket
CREATE POLICY "Anonymous submit tickets"
ON public.support_tickets FOR INSERT
TO anon WITH CHECK (true);

CREATE POLICY "Authenticated submit tickets"
ON public.support_tickets FOR INSERT
TO authenticated WITH CHECK (true);

-- Users see their own tickets
CREATE POLICY "Users view own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Admins view & manage all tickets
CREATE POLICY "Admins view all tickets"
ON public.support_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update tickets"
ON public.support_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_support_tickets
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);