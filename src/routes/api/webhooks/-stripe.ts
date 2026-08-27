import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Placeholder Stripe Secret from environment
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const APIRoute = createAPIFileRoute("/api/webhooks/stripe")({
  POST: async ({ request }) => {
    try {
      const signature = request.headers.get("stripe-signature");
      if (!signature || !STRIPE_WEBHOOK_SECRET) {
        return new Response("Missing signature or secret", { status: 400 });
      }

      const body = await request.text();
      // In a real app, verify the signature with Stripe SDK here:
      // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
      
      const event = JSON.parse(body);

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          
          // Update the user's role to PRO in Supabase profiles
          if (session.client_reference_id) {
            await supabaseAdmin
              .from("profiles")
              .update({ role: "pro" })
              .eq("id", session.client_reference_id);
          }
          break;
          
        case "customer.subscription.deleted":
          const subscription = event.data.object;
          // Demote user
          if (subscription.client_reference_id) {
            await supabaseAdmin
              .from("profiles")
              .update({ role: "user" })
              .eq("id", subscription.client_reference_id);
          }
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Webhook error:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  },
});
