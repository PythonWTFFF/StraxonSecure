-- =================================================================================
-- PHASE 3: FAST - PERFORMANCE OPTIMIZATION
-- Issue: Supabase RLS causes full table scans if user_id or tenant columns are unindexed.
-- Action: Index every column referenced by an RLS policy.
-- =================================================================================

-- 1. Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 2. Lesson Progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);

-- 3. Architectures
CREATE INDEX IF NOT EXISTS idx_architectures_user_id ON public.architectures(user_id);

-- 4. SOC Events (user_id and created_at are already indexed partially, but let's ensure user_id is)
CREATE INDEX IF NOT EXISTS idx_soc_events_user_id ON public.soc_events(user_id);

-- 5. Scan Results
CREATE INDEX IF NOT EXISTS idx_scan_results_user_id ON public.scan_results(user_id);

-- 6. Subscriptions & Payments
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- 7. Teams and Team Members
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);

-- 8. Leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);

-- 9. Compliance Runs
CREATE INDEX IF NOT EXISTS idx_compliance_runs_user_id ON public.compliance_runs(user_id);

-- 10. Lab Sessions
CREATE INDEX IF NOT EXISTS idx_lab_sessions_user_id ON public.lab_sessions(user_id);

-- 11. CTF Solves & Hints
CREATE INDEX IF NOT EXISTS idx_ctf_solves_user_id ON public.ctf_solves(user_id);
CREATE INDEX IF NOT EXISTS idx_ctf_hint_usage_user_id ON public.ctf_hint_usage(user_id);

-- 12. IR Playbooks
CREATE INDEX IF NOT EXISTS idx_ir_playbooks_user_id ON public.ir_playbooks(user_id);

-- 13. War Room
CREATE INDEX IF NOT EXISTS idx_warroom_sessions_creator_id ON public.warroom_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_warroom_participants_user_id ON public.warroom_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_warroom_messages_user_id ON public.warroom_messages(user_id);

-- 14. EDR
CREATE INDEX IF NOT EXISTS idx_edr_endpoints_user_id ON public.edr_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_edr_process_events_user_id ON public.edr_process_events(user_id);

-- 15. PCAP Sessions
CREATE INDEX IF NOT EXISTS idx_pcap_sessions_user_id ON public.pcap_sessions(user_id);

-- 16. API Keys & Webhooks
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
