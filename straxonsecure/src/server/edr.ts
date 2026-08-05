import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { triggerWebhooks } from "./developer";


// ─── Get All Endpoints ────────────────────────────────────────────────────────

export const getEDREndpoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("edr_endpoints")
      .select("*")
      .eq("user_id", context.userId)
      .order("last_seen", { ascending: false });

    if (error) throw new Error(error.message);
    return { endpoints: data ?? [] };
  });

// ─── Upsert Endpoint ─────────────────────────────────────────────────────────

export const upsertEDREndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        hostname: z.string().max(200),
        ip_address: z.string().max(50),
        os: z.string().max(100).default("Unknown"),
        status: z.enum(["healthy", "suspicious", "compromised", "offline"]).default("healthy"),
        agent_version: z.string().max(30).default("1.0.0"),
        tags: z.array(z.string()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      hostname: data.hostname,
      ip_address: data.ip_address,
      os: data.os,
      status: data.status,
      agent_version: data.agent_version,
      tags: data.tags,
      last_seen: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("edr_endpoints")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: saved, error } = await supabaseAdmin
        .from("edr_endpoints")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: saved.id };
    }
  });

// ─── Delete Endpoint ─────────────────────────────────────────────────────────

export const deleteEDREndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ endpointId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await supabaseAdmin
      .from("edr_endpoints")
      .delete()
      .eq("id", data.endpointId)
      .eq("user_id", context.userId);
    return { ok: true };
  });

// ─── Update Endpoint Status ───────────────────────────────────────────────────

export const updateEndpointStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        endpointId: z.string().uuid(),
        status: z.enum(["healthy", "suspicious", "compromised", "offline"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("edr_endpoints")
      .update({ status: data.status, last_seen: new Date().toISOString() })
      .eq("id", data.endpointId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Analyze Process ─────────────────────────────────────────────────────────

export const analyzeProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        endpointId: z.string().uuid().optional(),
        processName: z.string(),
        commandLine: z.string(),
        parentProcess: z.string(),
        user: z.string(),
        hash: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const prompt = `
You are an expert EDR (Endpoint Detection and Response) AI analyst.
Analyze the following process execution event for malicious behavior:

- Process: ${data.processName}
- Parent: ${data.parentProcess}
- Command Line: ${data.commandLine}
- User Context: ${data.user}
- SHA256: ${data.hash}

Is this process malicious (e.g. living off the land, ransomware, backdoor, privilege escalation)?
Provide a highly concise response in Markdown:
1. Threat Level (Low/Medium/High/Critical)
2. Analysis (Brief explanation of what this command is doing)
3. Recommended Action (e.g. Kill Process, Isolate Host, Ignore)
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI not configured: GEMINI_API_KEY missing");

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert EDR threat analyst. Analyze process events for malicious behavior. Be precise and concise.",
            },
            { role: "user", content: prompt },
          ],
        }),
      },
    );

    if (!res.ok) throw new Error("AI analysis failed");
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const analysis = json.choices?.[0]?.message?.content ?? "";

    let threat_level: "low" | "medium" | "high" | "critical" = "low";
    const threatMatch = analysis.match(/Threat Level.*?(Critical|High|Medium|Low)/i);
    if (threatMatch) {
      threat_level = threatMatch[1].toLowerCase() as typeof threat_level;
    }

    // Save process event to DB if endpoint is known
    if (data.endpointId) {
      await supabaseAdmin.from("edr_process_events").insert({
        user_id: context.userId,
        endpoint_id: data.endpointId,
        process_name: data.processName,
        command_line: data.commandLine,
        parent_process: data.parentProcess,
        run_as_user: data.user,
        sha256_hash: data.hash,
        threat_level,
        ai_analysis: analysis,
        action_taken: threat_level === "critical" || threat_level === "high" ? "quarantined" : "monitored",
      });

      // Auto-update endpoint status if critical threat found
      if (threat_level === "critical") {
        await supabaseAdmin
          .from("edr_endpoints")
          .update({ status: "compromised", last_seen: new Date().toISOString() })
          .eq("id", data.endpointId)
          .eq("user_id", context.userId);
      } else if (threat_level === "high") {
        await supabaseAdmin
          .from("edr_endpoints")
          .update({ status: "suspicious", last_seen: new Date().toISOString() })
          .eq("id", data.endpointId)
          .eq("user_id", context.userId);
      }

      if (threat_level === "critical" || threat_level === "high") {
        // Trigger webhooks in the background (no await)
        triggerWebhooks(context.userId, "edr.threat_detected", {
          endpointId: data.endpointId,
          processName: data.processName,
          threatLevel: threat_level,
          analysis,
        }).catch(console.error);
      }
    }

    return {
      success: true,
      analysis,
      threat_level,
    };
  });

// ─── Get Process Events ───────────────────────────────────────────────────────

export const getProcessEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({ endpointId: z.string().uuid().optional(), limit: z.number().int().max(100).default(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = supabaseAdmin
      .from("edr_process_events")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.endpointId) {
      q = q.eq("endpoint_id", data.endpointId);
    }

    const { data: events, error } = await q;
    if (error) throw new Error(error.message);
    return { events: events ?? [] };
  });
