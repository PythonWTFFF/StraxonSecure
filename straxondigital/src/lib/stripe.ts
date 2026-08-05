// Stripe checkout placeholder utilities.
// Wire to real Stripe edge function later — see /src/api/webhooks.

import { ServiceDef } from "@/lib/services";

export interface CheckoutPayload {
  service: ServiceDef;
  orderId: string;
  email: string;
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<{ url: string | null }> {
  // Placeholder: in production this calls a Supabase Edge Function that
  // creates a Stripe Checkout Session and returns the URL.
  console.info("[stripe] createCheckoutSession", payload);
  return { url: null };
}
