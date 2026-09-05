import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    // Enterprise Security: 15 Minute Idle Timeout
    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      if (session) {
        timeoutId = setTimeout(
          async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          },
          15 * 60 * 1000,
        ); // 15 minutes
      }
    };

    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keypress", resetTimeout);
    resetTimeout();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      } else if (
        typeof window !== "undefined" &&
        localStorage.getItem("straxon_demo_user") === "true"
      ) {
        const demoUser = {
          id: "demo-operator-001",
          email: "demo.operator@straxon.io",
          aud: "authenticated",
          role: "authenticated",
          user_metadata: { name: "VIP Evaluator (Demo Clearance)" },
          app_metadata: { provider: "straxon_sandbox" },
          created_at: new Date().toISOString(),
        } as unknown as User;
        setUser(demoUser);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keypress", resetTimeout);
      clearTimeout(timeoutId);
    };
  }, [session]);

  return { session, user, loading };
}
