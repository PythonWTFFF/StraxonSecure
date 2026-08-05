// Stripe webhook listener.
// Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET as Lovable Cloud secrets to enable signature verification.
// Endpoint: https://<project>.supabase.co/functions/v1/stripe-webhook
// Forward order_id in checkout session metadata; user_id + plan_name in subscription metadata.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items?: { data: Array<{ price?: { nickname?: string; id?: string } }> };
  metadata?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const event = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    console.log("[stripe-webhook] event:", event?.type);

    switch (event?.type) {
      case "checkout.session.completed": {
        const session = event.data?.object;
        const orderId = session?.metadata?.order_id;
        if (orderId) {
          const { error } = await admin
            .from("orders")
            .update({ status: "processing", progress: 10 })
            .eq("id", orderId);
          if (error) throw error;
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data?.object;
        const orderId = invoice?.metadata?.order_id;
        if (orderId) {
          await admin.from("invoices").update({ status: "paid" }).eq("order_id", orderId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data?.object as StripeSubscription;
        const userId = sub?.metadata?.user_id;
        if (!userId) {
          console.warn("[stripe-webhook] missing metadata.user_id on subscription", sub?.id);
          break;
        }
        const planName =
          sub.items?.data?.[0]?.price?.nickname ??
          sub.metadata?.plan_name ??
          "Pro";
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_sub_id: sub.id,
            stripe_customer_id: sub.customer,
            plan_name: planName,
            status: sub.status,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          },
          { onConflict: "stripe_sub_id" },
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data?.object as StripeSubscription;
        await admin
          .from("subscriptions")
          .update({ status: "canceled", cancel_at_period_end: false })
          .eq("stripe_sub_id", sub.id);
        break;
      }

      default:
        console.log("[stripe-webhook] unhandled event:", event?.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stripe-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
