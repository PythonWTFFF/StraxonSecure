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
