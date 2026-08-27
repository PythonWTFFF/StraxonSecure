import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { createRateLimiter } from "@/server/security/rateLimit";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface CveItem {
  cve_id: string;
  severity: string;
  cvss_score: number | null;
  title: string;
  description: string;
  published_at: string;
  source_url: string;
  cached_at?: string;
}

import { withSpan } from "@/server/telemetry";
import { sharedCache } from "@/server/utils/cache";
import { getCache, setCache } from "@/server/redis";

// ─── Fetch & Cache CVEs from NVD ─────────────────────────────────────────────

export const fetchThreatIntel = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    return withSpan("fetchThreatIntel", async (span) => {
      if ((context as ServerContext).requestId as string)
        span.setAttribute("requestId", (context as ServerContext).requestId as string);

      // In-process cache first (60s TTL)
      const memCached = sharedCache.get<any>("threat_intel_cves");
      if (memCached) {
        return memCached;
      }

      // Try DB cached next (10 min TTL)
      const { data: cached } = await supabaseAdmin
        .from("threat_intel")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(50);

      if (cached && cached.length > 0) {
        const newest = new Date((cached[0] as CveItem).cached_at ?? 0).getTime();
        if (Date.now() - newest < 10 * 60 * 1000) {
          const result = { items: cached, cached: true, error: null };
          sharedCache.set("threat_intel_cves", result, 60000);
          return result;
        }
      }

      try {
        const res = await fetch(
          "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=50&noRejected",
          { headers: { "User-Agent": "StraxonSecure/3.0" } },
        );
        if (!res.ok) {
          return { items: cached ?? [], cached: true, error: `NVD ${res.status}` };
        }
        const json = await res.json();
        const items: CveItem[] = (json.vulnerabilities ?? []).map((v: any) => {
          const cve = v.cve;
          const metric =
            cve.metrics?.cvssMetricV31?.[0]?.cvssData ||
            cve.metrics?.cvssMetricV30?.[0]?.cvssData ||
            cve.metrics?.cvssMetricV2?.[0]?.cvssData;
          const desc = cve.descriptions?.find((d: any) => d.lang === "en")?.value ?? "";
          return {
            cve_id: cve.id,
            severity: (metric?.baseSeverity ?? "UNKNOWN").toUpperCase(),
            cvss_score: metric?.baseScore ?? null,
            title: cve.id,
            description: desc.slice(0, 600),
            published_at: cve.published,
            source_url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
          };
        });

        if (items.length > 0) {
          try {
            await supabaseAdmin.from("threat_intel").upsert(
              items.map((i) => ({ ...i, cached_at: new Date().toISOString() })),
              { onConflict: "cve_id" },
            );
          } catch (e) {
            // ignore supabase error
          }
        }
        const result = {
          items: items,
          cached: false,
          error: items.length === 0 ? "No items returned from NVD" : null,
        };
        sharedCache.set("threat_intel_cves", result, 60000);
        return result;
      } catch (e) {
        const errorResult = {
          items: cached && cached.length > 0 ? cached : [],
          cached: true,
          error: e instanceof Error ? e.message : "fetch failed",
        };
        sharedCache.set("threat_intel_cves", errorResult, 60000);
        return errorResult;
      }
    });
  });

// ─── AI Analyze a Specific CVE ────────────────────────────────────────────────

export const analyzeCVE = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth, createRateLimiter(10, 60, "rate_limit:ai_cve")])
  .validator((d) =>
    z
      .object({
        cveId: z.string().max(30),
        description: z.string().max(1000),
        severity: z.string(),
        cvssScore: z.number().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const cacheKey = `cve-analysis:${data.cveId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return { analysis: cached };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const prompt = `You are STRAX-INTEL, an elite vulnerability analyst. Analyze this CVE and provide a structured threat briefing:

CVE ID: ${data.cveId}
Severity: ${data.severity} (CVSS: ${data.cvssScore ?? "N/A"})
Description: ${data.description}

Provide a structured analysis in markdown with these exact sections:
## 🎯 Attack Vector
## 💥 Impact Assessment  
## 🔍 Affected Systems
## 🛡️ Immediate Mitigations
## 🔗 MITRE ATT&CK Mapping
## ⚡ Priority Rating (1-10 with justification)

Be concise, technical, and actionable. Max 400 words.`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    if (!res.ok) throw new Error("AI analysis failed");
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const analysis = json.choices?.[0]?.message?.content ?? "";
    
    // Cache for 24 hours
    if (analysis) {
      await setCache(cacheKey, analysis, 86400);
    }
    
    return { analysis };
  });

// ─── Search CVEs ──────────────────────────────────────────────────────────────

export const searchCVEs = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        query: z.string().max(200),
        severity: z.enum(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("ALL"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("threat_intel")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50);

    if (data.query.trim()) {
      q = q.or(`cve_id.ilike.%${data.query}%,description.ilike.%${data.query}%`);
    }

    if (data.severity !== "ALL") {
      q = q.eq("severity", data.severity);
    }

    const { data: items, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });
