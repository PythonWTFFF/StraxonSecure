import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");
        if (!secret || !signature) return new Response("ok");

        const crypto = await import("crypto");
        const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
        if (expected !== signature) return new Response("Invalid signature", { status: 401 });

        const event = JSON.parse(body);
        const payment = event.payload?.payment?.entity;
        const userId = payment?.notes?.user_id;
        if (!userId) return new Response("ok");

        if (event.event === "payment.captured") {
          await supabaseAdmin.from("payments").insert({
            user_id: userId,
            provider: "razorpay",
            provider_payment_id: payment.id,
            amount_cents: Math.round(payment.amount / 83),
            currency: payment.currency?.toLowerCase() ?? "inr",
            status: "succeeded",
            description: "Razorpay payment",
          });
        }
        return new Response("ok");
      },
    },
  },
});
