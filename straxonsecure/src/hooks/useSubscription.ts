import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type SubPlan = "free" | "pro_monthly" | "pro_yearly";

export interface Subscription {
  id: string;
  plan: SubPlan;
  status: SubStatus;
  provider: "stripe" | "razorpay" | "none";
  trial_ends_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = useCallback(async () => {
    if (!user) {
      setSub(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSub(data as Subscription | null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchSub();
  }, [authLoading, fetchSub]);

  const now = Date.now();
  const trialActive =
    !!sub && sub.status === "trialing" && new Date(sub.trial_ends_at).getTime() > now;
  const paidActive =
    !!sub &&
    sub.status === "active" &&
    (!sub.current_period_end || new Date(sub.current_period_end).getTime() > now);

  // Local bypass check
  const devOverride =
    typeof window !== "undefined" &&
    import.meta.env.DEV &&
    localStorage.getItem("dev_pro_override") === "true";

  const hasAccess = devOverride || trialActive || paidActive;
  const trialDaysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - now) / 86400000))
    : 0;

  return {
    sub,
    loading: loading || authLoading,
    hasAccess,
    trialActive,
    paidActive,
    trialDaysLeft,
    refresh: fetchSub,
  };
}
