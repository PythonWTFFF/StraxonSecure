-- Allow anonymous insert access for EdTech opportunities (MVP)
CREATE POLICY "Allow public insert access on edtech_opportunities"
    ON public.edtech_opportunities
    FOR INSERT
    WITH CHECK (true);
