import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.8.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "sk_test_placeholder";
const stripe = new Stripe(STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { orderId, service, email } = await req.json();
    
    // Fallback URL, typically you'd read the origin from headers or env
    const origin = req.headers.get("origin") ?? "https://straxondigital.com";

    // Build line items based on service definition
    const lineItems = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: service.name,
          description: service.tagline,
        },
        unit_amount: service.priceCents,
        recurring: service.tier === "subscription" ? { interval: "month" } : undefined,
      },
      quantity: 1,
    }];

    const sessionData: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: service.tier === "subscription" ? "subscription" : "payment",
      success_url: `${origin}/dashboard?order=${orderId}&success=true`,
      cancel_url: `${origin}/dashboard?order=${orderId}&canceled=true`,
      customer_email: email,
      metadata: {
        order_id: orderId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
