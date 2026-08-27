import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// ===== SCHEDULES =====

export const getSchedule = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("report_schedules")
      .select("*")
      .eq("user_id", (context as ServerContext).userId as string)
      .single();

    // It's okay if not found, we'll return null to the frontend
    return data || null;
  });

export const updateSchedule = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        frequency: z.enum(["daily", "weekly", "monthly"]),
        emails: z.array(z.string().email()),
        active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: schedule, error } = await supabaseAdmin
      .from("report_schedules")
      .upsert(
        {
          user_id: (context as ServerContext).userId as string,
          frequency: data.frequency,
          emails: data.emails,
          active: data.active,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw new Error("Failed to update report schedule");
    return schedule;
  });

// ===== AGGREGATION ENGINE =====

export const getReportMetrics = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. EDR Metrics
    const { data: edrEvents } = await supabaseAdmin
      .from("edr_process_events")
      .select("threat_level")
      .eq("user_id", (context as ServerContext).userId as string);

    const edrStats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    if (edrEvents) {
      edrEvents.forEach((e: any) => {
        edrStats.total++;
        if (e.threat_level === "critical") edrStats.critical++;
        if (e.threat_level === "high") edrStats.high++;
        if (e.threat_level === "medium") edrStats.medium++;
        if (e.threat_level === "low") edrStats.low++;
      });
    }

    // 2. Compliance Metrics (Latest Run)
    const { data: complianceRuns } = await supabaseAdmin
      .from("compliance_runs")
      .select("status, controls_passed, controls_failed, total_controls")
      .eq("user_id", (context as ServerContext).userId as string)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestCompliance = complianceRuns && complianceRuns.length > 0 ? complianceRuns[0] : null;

    // 3. EASM Metrics
    // First find user targets
    const { data: targets } = await supabaseAdmin
      .from("easm_targets")
      .select("id")
      .eq("user_id", (context as ServerContext).userId as string);

    const easmStats = { totalFindings: 0, subdomains: 0, openPorts: 0 };

    if (targets && targets.length > 0) {
      const targetIds = targets.map((t: any) => t.id);
      const { data: findings } = await supabaseAdmin
        .from("easm_findings")
        .select("finding_type")
        .in("target_id", targetIds);

      if (findings) {
        easmStats.totalFindings = findings.length;
        findings.forEach((f: any) => {
          if (f.finding_type === "subdomain") easmStats.subdomains++;
          if (f.finding_type === "open_port") easmStats.openPorts++;
        });
      }
    }

    // 4. SOC Metrics
    const { count: socAlerts } = await supabaseAdmin
      .from("soc_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", (context as ServerContext).userId as string);

    return {
      timestamp: new Date().toISOString(),
      edr: edrStats,
      compliance: latestCompliance,
      easm: easmStats,
      soc: {
        totalAlerts: socAlerts || 0,
      },
    };
  });
