// Stripe checkout utilities.
import { ServiceDef } from "@/lib/services";
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutPayload {
  service: ServiceDef;
  orderId: string;
  email: string;
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<{ url: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: payload,
    });
    
    if (error) throw error;
    return { url: data.url };
  } catch (err) {
    console.error("[stripe] createCheckoutSession error:", err);
    return { url: null };
  }
}

export async function createPortalSession(customerId: string): Promise<{ url: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-portal", {
      body: { customerId },
    });
    
    if (error) throw error;
    return { url: data.url };
  } catch (err) {
    console.error("[stripe] createPortalSession error:", err);
    return { url: null };
  }
}
