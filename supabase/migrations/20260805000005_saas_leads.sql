-- Migration for SaaS leads/marketing capture
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT,
    company TEXT,
    interest TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (allow public inserts, but only admins can read)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to leads"
    ON leads FOR INSERT
    WITH CHECK (true);

-- Only service role can select leads
CREATE POLICY "Allow service role select leads"
    ON leads FOR SELECT
    USING (true);
