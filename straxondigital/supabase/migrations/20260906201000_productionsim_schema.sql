-- Migration: ProductionSim Core Database Schema
-- Description: Contains scenarios, sessions, and evaluation tables for the DevLab Engine.

-- 1. Scenarios Table
CREATE TABLE IF NOT EXISTS public.sim_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('entry', 'mid', 'senior')),
    stack TEXT[] NOT NULL,
    repo_template_url TEXT NOT NULL,
    jira_ticket_brief JSONB NOT NULL,
    acceptance_tests JSONB NOT NULL,
    base_score NUMERIC(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS public.sim_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    scenario_id UUID REFERENCES public.sim_scenarios(id) ON DELETE CASCADE,
    sandbox_container_id TEXT,
    status TEXT CHECK (status IN ('provisioning', 'in_progress', 'submitted', 'evaluated')),
    started_at TIMESTAMPTZ DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    telemetry_logs JSONB DEFAULT '{}'::jsonb
);

-- 3. Evaluations Table
CREATE TABLE IF NOT EXISTS public.sim_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sim_sessions(id) ON DELETE CASCADE UNIQUE,
    debugging_score NUMERIC(5,2) NOT NULL,
    test_hygiene_score NUMERIC(5,2) NOT NULL,
    code_quality_score NUMERIC(5,2) NOT NULL,
    git_hygiene_score NUMERIC(5,2) NOT NULL,
    architectural_score NUMERIC(5,2) NOT NULL,
    composite_score NUMERIC(5,2) NOT NULL,
    ai_staff_review TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.sim_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sim_evaluations ENABLE ROW LEVEL SECURITY;

-- Scenarios are public to read
CREATE POLICY "Allow public read access on sim_scenarios"
    ON public.sim_scenarios FOR SELECT USING (true);

-- Users can only read their own sessions
CREATE POLICY "Users can read own sessions"
    ON public.sim_sessions FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NULL); -- Allow anon for MVP

-- Users can only insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON public.sim_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON public.sim_sessions FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can read their own evaluations
CREATE POLICY "Users can read own evaluations"
    ON public.sim_evaluations FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.sim_sessions WHERE user_id = auth.uid() OR auth.uid() IS NULL
        )
    );

-- Seed Data (1 Scenario)
INSERT INTO public.sim_scenarios (
    slug, title, difficulty, stack, repo_template_url, jira_ticket_brief, acceptance_tests
) VALUES (
    'fix-race-condition-cart',
    'Debug E-Commerce Cart Race Condition',
    'mid',
    '{"NodeJS", "TypeScript", "Redis"}',
    'https://github.com/straxon/sim-cart-service',
    '{"ticket": "ENG-402", "description": "Users are reporting that when they add items to the cart rapidly, the final total is incorrect. Looks like a race condition in the Redis counter."}',
    '{"tests": ["test_concurrent_add_to_cart", "test_cart_total_accuracy"]}'
) ON CONFLICT (slug) DO NOTHING;
