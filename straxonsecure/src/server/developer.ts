import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import crypto from "crypto";

// ===== API KEYS =====

export const generateApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Generate a secure random API key
    const rawKey = `strx_live_${crypto.randomBytes(24).toString("hex")}`;
    
    // Hash it for storage
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const { error } = await supabaseAdmin.from("api_keys").insert({
      user_id: context.userId,
      key_hash: keyHash,
    });

    if (error) throw new Error("Failed to save API key");

    return { apiKey: rawKey };
  });

// ===== WEBHOOKS =====

export const getWebhooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });

export const addWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    // Generate a signing secret for HMAC
    const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;

    const { data: webhook, error } = await supabaseAdmin
      .from("webhooks")
      .insert({
        user_id: context.userId,
        url: data.url,
        secret,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to add webhook");
    return webhook;
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("webhooks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    
    if (error) throw new Error("Failed to delete webhook");
    return { success: true };
  });

// ===== TRIGGER INTERNAL HELPER =====

export async function triggerWebhooks(userId: string, eventType: string, payload: any) {
  // 1. Fetch active webhooks for this user
  const { data: webhooks, error } = await supabaseAdmin
    .from("webhooks")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true);

  if (error || !webhooks || webhooks.length === 0) return;

  const eventPayload = JSON.stringify({
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  // 2. Dispatch to each webhook
  const promises = webhooks.map(async (wh) => {
    try {
      // Create HMAC signature using the webhook secret
      const signature = crypto
        .createHmac("sha256", wh.secret)
        .update(eventPayload)
        .digest("hex");

      await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Straxon-Signature": signature,
          "User-Agent": "Straxon-Webhook-Engine/1.0",
        },
        body: eventPayload,
      });
    } catch (err) {
      console.error(`Failed to trigger webhook ${wh.url}:`, err);
    }
  });

  await Promise.allSettled(promises);
}
