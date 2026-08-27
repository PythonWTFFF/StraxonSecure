import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequest } from "@tanstack/react-start/server";
import { sharedCache } from "@/server/utils/cache";
// ─── Advanced SOC Analytics ──────────────────────────────────────────────────

export const getSOCAnalytics = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async () => {
    const cached = sharedCache.get<any>("soc_analytics");
    if (cached) return cached;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, topIPs, topCountries, severityCounts] = await Promise.all([
      supabaseAdmin
        .from("soc_events")
        .select("severity, attack_type, source_country, created_at, mitre_tactic")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabaseAdmin
        .from("soc_events")
        .select("source_ip")
        .gte("created_at", since)
        .not("source_ip", "is", null)
        .limit(500),
      supabaseAdmin
        .from("soc_events")
        .select("source_country")
        .gte("created_at", since)
        .not("source_country", "is", null)
        .limit(500),
      supabaseAdmin.from("soc_events").select("severity").gte("created_at", since),
    ]);

    const events = eventsRes.data ?? [];

    // Attack type frequency
    const attackFreq: Record<string, number> = {};
    const tacticFreq: Record<string, number> = {};
    for (const e of events) {
      attackFreq[e.attack_type] = (attackFreq[e.attack_type] ?? 0) + 1;
      if (e.mitre_tactic) tacticFreq[e.mitre_tactic] = (tacticFreq[e.mitre_tactic] ?? 0) + 1;
    }

    // Top attacker IPs
    const ipFreq: Record<string, number> = {};
    for (const r of topIPs.data ?? []) {
      if (r.source_ip) ipFreq[r.source_ip] = (ipFreq[r.source_ip] ?? 0) + 1;
    }

    // Country frequency
    const countryFreq: Record<string, number> = {};
    for (const r of topCountries.data ?? []) {
      if (r.source_country)
        countryFreq[r.source_country] = (countryFreq[r.source_country] ?? 0) + 1;
    }

    // Severity breakdown
    const sevBreak: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of severityCounts.data ?? []) {
      if (r.severity in sevBreak) sevBreak[r.severity]++;
    }

    // Hourly trend (last 24h bucketed)
    const hourlyBuckets: Record<number, number> = {};
    for (const e of events) {
      const h = new Date(e.created_at).getHours();
      hourlyBuckets[h] = (hourlyBuckets[h] ?? 0) + 1;
    }
    const hourlyTrend = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      count: hourlyBuckets[i] ?? 0,
    }));

    const result = {
      totalEvents: events.length,
      severityBreakdown: sevBreak,
      topAttackTypes: Object.entries(attackFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([type, count]) => ({ type, count })),
      topIPs: Object.entries(ipFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count })),
      topCountries: Object.entries(countryFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([country, count]) => ({ country, count })),
      hourlyTrend,
      mitreTactics: Object.entries(tacticFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tactic, count]) => ({ tactic, count })),
    };
    sharedCache.set("soc_analytics", result, 60000); // 1 minute TTL
    return result;
  });

// ─── Block IP ────────────────────────────────────────────────────────────────

export const blockIP = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        ip: z
          .string()
          .ip()
          .or(z.string().regex(/^\d+\.\d+\.\d+\.\d+$/)),
        reason: z.string().max(500).default("Manual block"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Insert a SOC event as a block action
    const { error } = await supabaseAdmin.from("soc_events").insert({
      user_id: (context as ServerContext).userId as string,
      severity: "high",
      attack_type: "IP_BLOCK",
      source_ip: data.ip,
      message: `IP manually blocked: ${data.reason}`,
      response_action: "block",
      analyst_notes: `Blocked by analyst ${(context as ServerContext).userId as string}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true, ip: data.ip };
  });

// ─── Mark Event False Positive ───────────────────────────────────────────────

export const markFalsePositive = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("soc_events")
      .update({ false_positive: true, response_action: "dismissed" })
      .eq("id", data.eventId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Ingest Threat Event (server-side) ───────────────────────────────────────

const threatEventSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  attack_type: z.string().max(100),
  source_ip: z.string().optional(),
  source_country: z.string().optional(),
  source_lat: z.number().optional(),
  source_lng: z.number().optional(),
  target: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  mitre_tactic: z.string().optional(),
  mitre_technique: z.string().optional(),
  raw_payload: z.string().max(5000).optional(),
  ioc_hash: z.string().optional(),
});

export const ingestThreatEvent = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => threatEventSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: event, error } = await supabaseAdmin
      .from("soc_events")
      .insert({ ...data, user_id: (context as ServerContext).userId as string })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Update posture SOC score
    await supabaseAdmin
      .from("posture_evaluations")
      .upsert({ user_id: ((context as ServerContext).userId as string) }, { onConflict: "user_id" });

    return { eventId: event.id };
  });

// ─── Get Recent Events ───────────────────────────────────────────────────────

export const getRecentSOCEvents = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("soc_events")
      .select("*")
      .eq("false_positive", false)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { events: data ?? [] };
  });

// ─── Get ML Anomalies ───────────────────────────────────────────────────────

export const getMLAnomalies = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async () => {
    const { data: events } = await supabaseAdmin
      .from("soc_events")
      .select("id, severity, attack_type, source_ip, mitre_tactic, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!events || events.length === 0) return { anomalies: [] };

    try {
      const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${mlUrl}/api/ml/anomaly-detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
        signal: getRequest()?.signal,
      });
      if (res.ok) {
        const json = await res.json();
        return { anomalies: json.anomalies ?? [] };
      }
    } catch (e) {
      console.error("[ML Engine] Service unavailable", e);
    }
    return { anomalies: [] };
  });
