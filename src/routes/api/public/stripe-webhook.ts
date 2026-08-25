import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const body = await request.text();
        const sigHeader = request.headers.get("stripe-signature");

        if (!secret || !sigHeader) {
          return new Response("Webhook secret not configured", { status: 200 });
        }

        // Stripe signature verification (t=...,v1=...)
        const crypto = await import("crypto");
        const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
        const t = parts.t;
        const v1 = parts.v1;
        const expected = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
        if (expected !== v1) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body);
        const obj = event.data?.object ?? {};
        const userId = obj.metadata?.user_id || obj.client_reference_id;
        const plan = obj.metadata?.plan || "pro_monthly";

        if (!userId) return new Response("ok");

        if (
          event.type === "checkout.session.completed" ||
          event.type === "customer.subscription.created" ||
          event.type === "customer.subscription.updated"
        ) {
          const periodEnd = obj.current_period_end
            ? new Date(obj.current_period_end * 1000).toISOString()
            : null;
          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan,
              status: "active",
              provider: "stripe",
              provider_customer_id: obj.customer ?? null,
              provider_subscription_id: obj.subscription ?? obj.id ?? null,
              current_period_end: periodEnd,
              cancel_at_period_end: !!obj.cancel_at_period_end,
            })
            .eq("user_id", userId);
        } else if (event.type === "customer.subscription.deleted") {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId);
        } else if (event.type === "invoice.payment_succeeded") {
          await supabaseAdmin.from("payments").insert({
            user_id: userId,
            provider: "stripe",
            provider_payment_id: obj.id,
            amount_cents: obj.amount_paid ?? 0,
            currency: obj.currency ?? "usd",
            status: "succeeded",
            description: obj.description ?? "Stripe payment",
          });
        }
        return new Response("ok");
      },
    },
  },
});
