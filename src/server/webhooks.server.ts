import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";
import { assertSafeScanTarget } from "@/server/security/scanTarget";
import { decrypt } from "@/server/security/encryption";

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
      // SSRF Mitigation: validate webhook URL resolves to a public IP before dispatch.
      // This prevents attackers from using webhooks to probe internal services
      // (cloud metadata endpoints, Redis, internal APIs, etc.)
      await assertSafeScanTarget(wh.url);

      // Create HMAC signature using the webhook secret
      const secret = decrypt(wh.secret);
      const signature = crypto.createHmac("sha256", secret).update(eventPayload).digest("hex");

      let bodyPayload = eventPayload;
      if (wh.url.includes("hooks.slack.com") || wh.url.includes("discord.com/api/webhooks")) {
        // Format for Slack/Discord rich-text
        bodyPayload = JSON.stringify({
          text: `🚨 *Straxon Secure Alert: ${payload.threatLevel?.toUpperCase() || "NEW"} Threat Detected* 🚨\n\n*Process:* \`${payload.processName || "Unknown"}\`\n*Analysis:* ${payload.analysis || "No analysis provided."}`,
        });
      }

      await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Straxon-Signature": signature,
          "User-Agent": "Straxon-Webhook-Engine/1.0",
        },
        body: bodyPayload,
      });
    } catch (err) {
      console.error(`Failed to trigger webhook ${wh.url}:`, err);
    }
  });

  await Promise.allSettled(promises);
}
