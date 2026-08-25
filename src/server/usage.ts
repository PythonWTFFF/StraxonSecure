import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function checkFeatureUsage(
  userId: string,
  feature: "ai_prompt" | "pentest_scan" | "easm_scan" | "code_scan" | "lab_session",
): Promise<void> {
  // 1. Check if user is Pro
  const { data: sub } = await (supabaseAdmin as any)
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const isPro = sub && sub.status === "active" && new Date(sub.current_period_end) > new Date();

  if (isPro) return; // Unlimited for Pro users

  // 2. Free Tier Enforcement
  const { count } = await (supabaseAdmin as any)
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

  const limits: Record<string, number> = {
    ai_prompt: 3,
    pentest_scan: 1,
    easm_scan: 1,
    code_scan: 1,
    lab_session: 1,
  };

  const limit = limits[feature];
  if (count !== null && count >= limit) {
    throw new Error(
      `PAYMENT_REQUIRED: You have reached your daily limit of ${limit} for ${feature}. Please upgrade to Pro for unlimited access.`,
    );
  }
}

export async function logFeatureUsage(
  userId: string,
  feature: "ai_prompt" | "pentest_scan" | "easm_scan" | "code_scan" | "lab_session",
  details: any = {},
  requestId?: string,
): Promise<void> {
  const payload = {
    user_id: userId,
    feature,
    details: { ...details, requestId },
  };
  await (supabaseAdmin as any).from("usage_logs").insert(payload);
}
