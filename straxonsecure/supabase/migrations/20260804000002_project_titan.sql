-- Project Titan Advanced Database Mechanics

-- 1. Automated Streak Updating Trigger
-- When a user completes a lab or captures a CTF flag, update their streak.

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_active TIMESTAMP;
    current_streak INT;
BEGIN
    SELECT last_active_at, streak_days INTO last_active, current_streak
    FROM security_posture
    WHERE user_id = NEW.user_id;

    IF last_active IS NULL THEN
        UPDATE security_posture SET streak_days = 1, last_active_at = now() WHERE user_id = NEW.user_id;
    ELSIF last_active < now() - INTERVAL '1 day' AND last_active > now() - INTERVAL '2 days' THEN
        UPDATE security_posture SET streak_days = current_streak + 1, last_active_at = now() WHERE user_id = NEW.user_id;
    ELSIF last_active < now() - INTERVAL '2 days' THEN
        UPDATE security_posture SET streak_days = 1, last_active_at = now() WHERE user_id = NEW.user_id;
    ELSE
        -- Same day, just update last active
        UPDATE security_posture SET last_active_at = now() WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ctf_solve_streak ON ctf_solves;
CREATE TRIGGER trg_ctf_solve_streak
AFTER INSERT ON ctf_solves
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

DROP TRIGGER IF EXISTS trg_lab_session_streak ON lab_sessions;
CREATE TRIGGER trg_lab_session_streak
AFTER UPDATE ON lab_sessions
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION update_user_streak();

-- 2. Materialized View for Global Leaderboard
-- To optimize fetching the leaderboard for thousands of users

DROP MATERIALIZED VIEW IF EXISTS mv_global_leaderboard CASCADE;
CREATE MATERIALIZED VIEW mv_global_leaderboard AS
SELECT 
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    p.total_score,
    p.level,
    p.streak_days,
    p.badges,
    RANK() OVER (ORDER BY p.total_score DESC, p.updated_at ASC) as global_rank
FROM security_posture p
LEFT JOIN profiles pr ON p.user_id = pr.id;

CREATE UNIQUE INDEX idx_mv_global_leaderboard_user_id ON mv_global_leaderboard (user_id);
CREATE INDEX idx_mv_global_leaderboard_rank ON mv_global_leaderboard (global_rank);

-- 3. Function to refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_mv_global_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_leaderboard;
END;
$$ LANGUAGE plpgsql;
