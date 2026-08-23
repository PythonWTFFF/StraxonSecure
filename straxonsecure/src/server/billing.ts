import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { logAudit } from "@/server/security/audit";
import Stripe from "stripe";
import { createRateLimiter } from "@/server/security/rateLimit";

const PLANS = {
  pro_monthly: { amount_cents: 1900, currency: "usd", label: "Pro Monthly" },
  pro_yearly: { amount_cents: 19000, currency: "usd", label: "Pro Yearly" },
} as const;

type PlanKey = keyof typeof PLANS;

// Initialize Stripe if we have the key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ===== STRIPE CHECKOUT =====
export const createStripeCheckout = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth, createRateLimiter(5, 60, "rate_limit:checkout")])
  .validator((d) => z.object({ plan: z.enum(["pro_monthly", "pro_yearly"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const origin = process.env.SITE_URL || "http://localhost:8080";
    
    if (!stripe) {
      // Simulate checkout flow if no key exists by upgrading their subscription immediately
      const periodEnd = new Date();
      if (data.plan === "pro_yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        plan: data.plan,
        status: "active",
        provider: "stripe",
        provider_subscription_id: `sim_sub_${Date.now()}`,
        current_period_end: periodEnd.toISOString(),
      });

      await logAudit({
        requestId: ((context as any).requestId as string) ?? "unknown",
        actorUserId: (context as any).userId as string,
        orgId: "00000000-0000-0000-0000-000000000000",
        action: "billing.checkout_created",
        serverFn: "createStripeCheckout",
        metadata: { plan: data.plan, simulated: true },
      });

      return {
        error: null,
        url: `${origin}/billing?success=1&simulated=true`,
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

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/billing?success=1`,
        cancel_url: `${origin}/pricing?canceled=1`,
        client_reference_id: userId,
        metadata: {
          user_id: userId,
          plan: data.plan,
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            plan: data.plan,
          },
        },
      });

      await logAudit({
        requestId: ((context as any).requestId as string) ?? "unknown",
        actorUserId: (context as any).userId as string,
        orgId: "00000000-0000-0000-0000-000000000000",
        action: "billing.checkout_created",
        serverFn: "createStripeCheckout",
        metadata: { plan: data.plan, provider: "stripe", sessionId: session.id },
      });

      return { url: session.url, error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Stripe error", url: null };
    }
  });

// ===== STRIPE CUSTOMER PORTAL =====
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const origin = process.env.SITE_URL || "http://localhost:8080";

    if (!stripe) {
      return {
        error: "Stripe not configured. (In simulated mode, manage subscriptions manually).",
        url: null,
      };
    }

    try {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("provider_customer_id")
        .eq("user_id", userId)
        .single();

      if (!sub || !sub.provider_customer_id) {
        return { error: "No Stripe customer found for this user", url: null };
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.provider_customer_id,
        return_url: `${origin}/billing`,
      });

      await logAudit({
        requestId: ((context as any).requestId as string) ?? "unknown",
        actorUserId: (context as any).userId as string,
        orgId: "00000000-0000-0000-0000-000000000000",
        action: "billing.portal_created",
        serverFn: "createPortalSession",
      });

      return { url: session.url, error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Stripe error", url: null };
    }
  });


// ===== RAZORPAY ORDER =====
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth, createRateLimiter(5, 60, "rate_limit:checkout")])
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
        receipt: `${((context as any).userId as string).slice(0, 8)}-${Date.now()}`,
        notes: { user_id: (context as any).userId as string, plan: data.plan },
      }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error?.description || "Razorpay error", order: null };

    await logAudit({
      requestId: ((context as any).requestId as string) ?? "unknown",
      actorUserId: (context as any).userId as string,
      orgId: "00000000-0000-0000-0000-000000000000",
      action: "billing.order_created",
      serverFn: "createRazorpayOrder",
      metadata: { plan: data.plan, orderId: json.id, provider: "razorpay" },
    });

    return {
      order: { id: json.id, amount: json.amount, currency: json.currency },
      keyId,
      plan: data.plan,
      error: null,
    };
  });

// ===== RAZORPAY VERIFY (called after client-side success) =====
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
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
      .eq("user_id", (context as any).userId as string);

    await supabaseAdmin.from("payments").insert({
      user_id: (context as any).userId as string,
      provider: "razorpay",
      provider_payment_id: data.razorpay_payment_id,
      amount_cents: PLANS[data.plan as keyof typeof PLANS].amount_cents,
      currency: "inr",
      status: "succeeded",
      description: PLANS[data.plan as keyof typeof PLANS].label,
    });

    await logAudit({
      requestId: ((context as any).requestId as string) ?? "unknown",
      actorUserId: (context as any).userId as string,
      orgId: "00000000-0000-0000-0000-000000000000",
      action: "billing.payment_verified",
      serverFn: "verifyRazorpayPayment",
      metadata: { plan: data.plan, provider: "razorpay", paymentId: data.razorpay_payment_id },
    });

    return { ok: true };
  });

// ===== CANCEL =====
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("user_id", (context as any).userId as string);

    await logAudit({
      requestId: ((context as any).requestId as string) ?? "unknown",
      actorUserId: (context as any).userId as string,
      orgId: "00000000-0000-0000-0000-000000000000",
      action: "billing.subscription_cancelled",
      serverFn: "cancelSubscription",
    });

    return { ok: true };
  });

// ===== DEVELOPER BYPASS =====
export const developerBypass = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Force a Pro Monthly subscription
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 10); // 10 years access

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: (context as any).userId as string,
      plan: "pro_monthly",
      status: "active",
      provider: "developer_override",
      provider_subscription_id: `dev_${Date.now()}`,
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    });

    await logAudit({
      requestId: ((context as any).requestId as string) ?? "unknown",
      actorUserId: (context as any).userId as string,
      orgId: "00000000-0000-0000-0000-000000000000",
      action: "billing.developer_bypass",
      serverFn: "developerBypass",
      metadata: { plan: "pro_monthly" },
    });

    return { ok: true };
  });
