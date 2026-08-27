import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Use a ref for the idle timeout so it doesn't trigger re-renders
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    // 1. Subscribe to auth state changes (handles login, logout, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      sessionRef.current = s;
      setSession(s);
      setUser(s?.user ?? null);
      resetIdleTimeout(s);
    });

    // 2. Load the initial session once on mount
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        // Clear any stale/broken token data silently
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
      } else {
        sessionRef.current = data.session;
        setSession(data.session);
        setUser(data.session.user);
        resetIdleTimeout(data.session);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // 3. Fix WebSocket Back-Forward Cache: re-validate session when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && sessionRef.current) {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) {
            setSession(null);
            setUser(null);
          }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearIdleTimeout();
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keypress", onActivity);
    };
  }, []); // Empty deps - run only once on mount

  // ── Idle timeout helpers ────────────────────────────────────────────────────
  function clearIdleTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function resetIdleTimeout(s: Session | null) {
    clearIdleTimeout();
    if (!s) return;
    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    }, 15 * 60 * 1000); // 15-minute idle timeout
  }

  const onActivity = () => {
    if (sessionRef.current) resetIdleTimeout(sessionRef.current);
  };

  // Register activity listeners once
  useEffect(() => {
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keypress", onActivity);
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keypress", onActivity);
    };
  }, []);

  return { session, user, loading };
}
