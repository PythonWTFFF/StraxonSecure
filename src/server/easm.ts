import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import * as net from "net";
import { checkFeatureUsage, logFeatureUsage } from "@/server/usage";
import { assertSafeScanTarget } from "@/server/security/scanTarget";

// ===== DB Helpers =====

export const getTargets = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("easm_targets")
      .select("*")
      .eq("user_id", (context as ServerContext).userId as string)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });

export const getFindings = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ targetId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Basic auth check ensuring the target belongs to the user
    const { data: target } = await supabaseAdmin
      .from("easm_targets")
      .select("id")
      .eq("id", data.targetId)
      .eq("user_id", (context as ServerContext).userId as string)
      .single();

    if (!target) throw new Error("Unauthorized or not found");

    const { data: findings, error } = await supabaseAdmin
      .from("easm_findings")
      .select("*")
      .eq("target_id", data.targetId)
      .order("discovered_at", { ascending: false });

    if (error) throw new Error(error.message);
    return findings;
  });

export const addTarget = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ domain: z.string().min(3) }).parse(d))
  .handler(async ({ data, context }) => {
    await checkFeatureUsage((context as ServerContext).userId as string, "easm_scan");

    // Strip http/https and paths if user entered a URL
    const cleanDomain = data.domain
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .trim()
      .toLowerCase();

    // SSRF Mitigation (we construct a dummy http url to use our existing validator)
    await assertSafeScanTarget(`http://${cleanDomain}`);

    const { data: target, error } = await supabaseAdmin
      .from("easm_targets")
      .insert({ user_id: (context as ServerContext).userId as string, domain: cleanDomain })
      .select()
      .single();

    if (error) throw new Error("Failed to add target. It might already exist.");

    await logFeatureUsage(
      (context as ServerContext).userId as string,
      "easm_scan",
      { domain: cleanDomain },
      (context as ServerContext).requestId as string,
    );

    // Fire off recon in the background so we don't block the UI
    runRecon(target.id, cleanDomain).catch(console.error);

    return target;
  });

// ===== OSINT ENGINE =====

// Simple TCP Port scanner helper
async function checkPort(host: string, port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// Background Task
async function runRecon(targetId: string, domain: string) {
  try {
    await supabaseAdmin
      .from("easm_targets")
      .update({ status: "scanning" })
      .eq("id", targetId);

    // 1. Subdomain Enumeration via crt.sh
    const crtUrl = `https://crt.sh/?q=%.${domain}&output=json`;
    const res = await fetch(crtUrl);

    const subdomains = new Set<string>();

    if (res.ok) {
      const logs = await res.json();
      for (const log of logs) {
        if (log.name_value) {
          // crt.sh can return multiple domains separated by newlines
          const names = log.name_value.split("\n");
          for (const n of names) {
            const clean = n.trim().toLowerCase();
            // Filter out wildcards and non-matching domains (sometimes crt.sh returns fuzzy matches)
            if (!clean.includes("*") && clean.endsWith(domain)) {
              subdomains.add(clean);
            }
          }
        }
      }
    }

    const uniqueSubdomains = Array.from(subdomains);

    // Save subdomains to DB
    const findingRecords = uniqueSubdomains.map((sub) => ({
      target_id: targetId,
      finding_type: "subdomain",
      value: sub,
      severity: "info",
    }));

    // Upsert to handle duplicates safely
    if (findingRecords.length > 0) {
      await supabaseAdmin
        .from("easm_findings")
        .upsert(findingRecords, { onConflict: "target_id, finding_type, value" });
    }

    // 2. Port Scanning on a small sample of discovered subdomains (limit to 10 to avoid huge delays)
    const scanTargets = uniqueSubdomains.slice(0, 10);
    const portsToScan = [80, 443, 22, 3389];

    for (const host of scanTargets) {
      for (const port of portsToScan) {
        const isOpen = await checkPort(host, port);
        if (isOpen) {
          let severity = "low";
          if (port === 22) severity = "medium";
          if (port === 3389) severity = "high"; // RDP exposed

          await supabaseAdmin.from("easm_findings").upsert(
            {
              target_id: targetId,
              finding_type: "open_port",
              value: `${host}:${port}`,
              severity,
              details: { port, host },
            },
            { onConflict: "target_id, finding_type, value" },
          );
        }
      }
    }

    // Done
    await supabaseAdmin
      .from("easm_targets")
      .update({ status: "completed" })
      .eq("id", targetId);
  } catch (error) {
    console.error("EASM Recon Failed for", domain, error);
    await supabaseAdmin
      .from("easm_targets")
      .update({ status: "failed" })
      .eq("id", targetId);
  }
}
