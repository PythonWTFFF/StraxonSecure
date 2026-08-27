import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { assertSafeScanTarget } from "@/server/security/scanTarget";
import crypto from "crypto";
import { encrypt } from "@/server/security/encryption";

// ===== API KEYS =====

export const generateApiKey = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Generate a secure random API key
    const rawKey = `strx_live_${crypto.randomBytes(24).toString("hex")}`;

    // Hash it for storage
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const { error } = await supabaseAdmin.from("api_keys").insert({
      user_id: (context as ServerContext).userId as string,
      key_hash: keyHash,
      name: "Default API Key",
    });

    if (error) throw new Error("Failed to save API key");

    return { apiKey: rawKey };
  });

// ===== WEBHOOKS =====

export const getWebhooks = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("user_id", (context as ServerContext).userId as string)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });

export const addWebhook = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    // SSRF Mitigation
    await assertSafeScanTarget(data.url);

    // Generate a signing secret for HMAC
    const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;

    const { data: webhook, error } = await supabaseAdmin
      .from("webhooks")
      .insert({
        user_id: (context as ServerContext).userId as string,
        url: data.url,
        secret: encrypt(secret),
      })
      .select()
      .single();

    if (error) throw new Error("Failed to add webhook");
    return webhook;
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("webhooks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", (context as ServerContext).userId as string);

    if (error) throw new Error("Failed to delete webhook");
    return { success: true };
  });
