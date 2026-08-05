import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const PLANS = {
  pro_monthly: { amount_cents: 1900, currency: "usd", label: "Pro Monthly" },
  pro_yearly: { amount_cents: 19000, currency: "usd", label: "Pro Yearly" },
} as const;

type PlanKey = keyof typeof PLANS;

// ===== STRIPE CHECKOUT =====
export const createStripeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ plan: z.enum(["pro_monthly", "pro_yearly"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return {
        error: "Stripe not configured. Add STRIPE_SECRET_KEY in Lovable Cloud secrets.",
        url: null,
      };
    }
    const priceId =
      data.plan === "pro_monthly"
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_YEARLY;
    if (!priceId) {
      return {
        error: `Missing STRIPE_PRICE_${data.plan === "pro_monthly" ? "MONTHLY" : "YEARLY"}.`,
        url: null,
      };
    }

    const origin = process.env.SITE_URL || "https://straxon.lovable.app";
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${origin}/billing?success=1`);
    params.append("cancel_url", `${origin}/pricing?canceled=1`);
    params.append("client_reference_id", userId);
    params.append("metadata[user_id]", userId);
    params.append("metadata[plan]", data.plan);
    params.append("subscription_data[metadata][user_id]", userId);
    params.append("subscription_data[metadata][plan]", data.plan);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: json.error?.message || "Stripe error", url: null };
    }
    return { url: json.url as string, error: null };
  });

// ===== RAZORPAY ORDER =====
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ plan: z.enum(["pro_monthly", "pro_yearly"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return {
        error: "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        order: null,
      };
    }

    const plan = PLANS[data.plan as PlanKey];
    // INR pricing approximation (USD * ~83). Razorpay amount in paise.
    const amountInr = Math.round((plan.amount_cents / 100) * 83 * 100);

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInr,
        currency: "INR",
        receipt: `${context.userId.slice(0, 8)}-${Date.now()}`,
        notes: { user_id: context.userId, plan: data.plan },
      }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error?.description || "Razorpay error", order: null };
    return {
      order: { id: json.id, amount: json.amount, currency: json.currency },
      keyId,
      plan: data.plan,
      error: null,
    };
  });

// ===== RAZORPAY VERIFY (called after client-side success) =====
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
        plan: z.enum(["pro_monthly", "pro_yearly"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return { ok: false, error: "Razorpay not configured" };

    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      return { ok: false, error: "Invalid signature" };
    }

    const periodEnd = new Date();
    if (data.plan === "pro_yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabaseAdmin
      .from("subscriptions")
      .update({
        plan: data.plan,
        status: "active",
        provider: "razorpay",
        provider_subscription_id: data.razorpay_payment_id,
        current_period_end: periodEnd.toISOString(),
      })
      .eq("user_id", context.userId);

    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "razorpay",
      provider_payment_id: data.razorpay_payment_id,
      amount_cents: PLANS[data.plan].amount_cents,
      currency: "inr",
      status: "succeeded",
      description: PLANS[data.plan].label,
    });

    return { ok: true };
  });

// ===== CANCEL =====
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("user_id", context.userId);
    return { ok: true };
  });

// ===== DEVELOPER BYPASS =====
export const developerBypass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Force a Pro Monthly subscription
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 10); // 10 years access

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: context.userId,
      plan: "pro_monthly",
      status: "active",
      provider: "developer_override",
      provider_subscription_id: `dev_${Date.now()}`,
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    });

    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      provider: "developer_override",
      provider_payment_id: `dev_pay_${Date.now()}`,
      amount_cents: 0,
      currency: "usd",
      status: "succeeded",
      description: "Developer Pro Override",
    });

    return { ok: true };
  });
