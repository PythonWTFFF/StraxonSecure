-- Enable realtime for soc_events
ALTER TABLE public.soc_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.soc_events;