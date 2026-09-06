import { createMiddleware } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AllowedTier = "pro" | "enterprise";

export function requireTier(minTier: AllowedTier = "pro") {
  return createMiddleware({ type: "function" }).server(async ({ next, context }) => {
    const ctx = context as any;
    const userId = ctx.userId;

    if (!userId) {
      throw new Response("Unauthorized: Authentication required for tier verification", {
        status: 401,
      });
    }

    // Query active subscription from Supabase
    const { data: sub, error } = await (supabaseAdmin as any)
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[tierGuard] Error checking subscription:", error);
    }

    const isActive =
      sub &&
      (sub.status === "active" || sub.status === "trialing") &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    const plan = (sub?.plan || "free").toLowerCase();

    // Enterprise tier requirement
    if (minTier === "enterprise") {
      const isEnterprise = isActive && plan.includes("enterprise");
      if (!isEnterprise) {
        throw new Response("PAYMENT_REQUIRED: This action requires an active Enterprise plan.", {
          status: 402,
        });
      }
    } else {
      // Pro tier requirement (pro or enterprise qualify)
      const isProOrAbove = isActive && (plan.includes("pro") || plan.includes("enterprise"));
      if (!isProOrAbove) {
        throw new Response("PAYMENT_REQUIRED: This action requires an active Pro plan.", {
          status: 402,
        });
      }
    }

    return next({
      context: {
        ...ctx,
        userTier: plan,
        isSubscriptionActive: true,
      },
    });
  });
}
