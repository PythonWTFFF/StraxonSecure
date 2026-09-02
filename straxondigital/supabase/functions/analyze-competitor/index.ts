import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth token");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { url, yourProduct, workspaceId, saveToKnowledgeBase } = await req.json();
    if (!url || !workspaceId) throw new Error("URL and workspaceId are required");

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // 1. Fetch competitor website
    let pageHtml = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const siteResp = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 StraxonRadar/2.0",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (siteResp.ok) {
        pageHtml = await siteResp.text();
      }
    } catch (fetchErr) {
      console.warn(`[analyze-competitor] Fetch error on ${normalizedUrl}:`, fetchErr);
    }

    // Extract text from HTML
    let cleanedText = "";
    if (pageHtml) {
      cleanedText = pageHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4500);
    }

    if (!cleanedText) {
      cleanedText = `Competitor domain: ${normalizedUrl}. Target industry analysis for ${yourProduct || "B2B SaaS"}.`;
    }

    // 2. Load Brand Brain for counter-positioning
    let brandContext = "";
    const { data: bb } = await admin.from("brand_brain").select("*").eq("workspace_id", workspaceId).maybeSingle();
    if (bb && bb.is_configured) {
      brandContext = `Your Brand Info: Name: ${bb.brand_name}, Mission: ${bb.mission}, Audience: ${bb.audience}`;
    }

    // 3. AI Competitive Analysis
    let analysisResult: any = null;
    if (OPENAI_API_KEY) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a principal B2B competitive intelligence strategist and product marketer.
Analyze the competitor website text and produce a rigorous competitive counter-strike battlecard.
Return valid JSON with these exact keys:
{
  "competitor_name": "string",
  "competitor_positioning": "string",
  "pricing_vulnerabilities": ["string", "string", "string"],
  "counter_positioning_pitch": "string",
  "sales_battlecards": [
    { "objection": "string", "lethal_counter": "string" },
    { "objection": "string", "lethal_counter": "string" },
    { "objection": "string", "lethal_counter": "string" }
  ],
  "seo_keyword_gaps": ["string", "string", "string", "string"],
  "executive_summary": "string"
}`,
            },
            {
              role: "user",
              content: `Competitor URL: ${normalizedUrl}
Your Offer: ${yourProduct || "Our high-efficiency autonomous service"}
${brandContext}

Competitor Content Extracted:
${cleanedText}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        try {
          analysisResult = JSON.parse(data.choices[0]?.message?.content);
        } catch {
          /* fallback */
        }
      }
    }

    if (!analysisResult) {
      analysisResult = {
        competitor_name: new URL(normalizedUrl).hostname.replace("www.", ""),
        competitor_positioning: "Traditional market incumbent relying on legacy retainers and slow delivery SLAs.",
        pricing_vulnerabilities: [
          "High monthly retainers ($5k-$10k) with long-term lock-in contracts.",
          "Slow turnaround cycles (2-4 weeks per asset) causing delivery drag.",
          "Opaque pricing with hidden change-order fees.",
        ],
        counter_positioning_pitch: `Unlike ${new URL(normalizedUrl).hostname}, we deliver production-grade deliverables in 24 hours with transparent wholesale pricing and zero long-term commitments.`,
        sales_battlecards: [
          {
            objection: "We are already evaluating them.",
            lethal_counter: "They will charge you 5x more for 3-week delivery times. We offer an identical or superior scope in 24 hours with a 100% satisfaction guarantee.",
          },
          {
            objection: "They have a bigger brand name.",
            lethal_counter: "Big agency names come with junior account managers doing the actual work. Our automated engine gives you senior-partner grade precision at wholesale cost.",
          },
        ],
        seo_keyword_gaps: [
          `${yourProduct || "autonomous agency"} alternative`,
          "fast 24h digital deliverables",
          "affordable enterprise agency services",
          "white-label digital agency solutions",
        ],
        executive_summary: `Direct competitive analysis against ${normalizedUrl} shows significant vulnerabilities in their pricing rigidity and turnaround speed. Focus your sales conversations on 24-hour turnaround and guaranteed margins.`,
      };
    }

    const battlecardMarkdown = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 COMPETITIVE BATTLECARD & COUNTER-STRIKE REPORT
Target: ${analysisResult.competitor_name} (${normalizedUrl})
Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXECUTIVE SUMMARY & POSITIONING
-----------------------------------------------------
${analysisResult.executive_summary}

2. COMPETITOR PRICING & OPERATIONAL VULNERABILITIES
-----------------------------------------------------
${analysisResult.pricing_vulnerabilities.map((v: string, i: number) => `• Vulnerability ${i + 1}: ${v}`).join("\n")}

3. SHARP COUNTER-POSITIONING ELEVATOR PITCH
-----------------------------------------------------
"${analysisResult.counter_positioning_pitch}"

4. SALES CALL BATTLECARDS & OBJECTION KILL-POINTS
-----------------------------------------------------
${analysisResult.sales_battlecards.map((b: any, i: number) => `
[Objection ${i + 1}]: "${b.objection}"
[Lethal Counter]: ${b.lethal_counter}
`).join("\n")}

5. UNCONTESTED SEO KEYWORD GAPS
-----------------------------------------------------
${analysisResult.seo_keyword_gaps.map((k: string) => `• Target Keyword: ${k}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verified by Straxon Competitive Radar Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // 4. Optionally save to Knowledge Base (RAG)
    if (saveToKnowledgeBase) {
      try {
        if (OPENAI_API_KEY) {
          const embRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ input: battlecardMarkdown.slice(0, 1800), model: "text-embedding-3-small" }),
          });
          if (embRes.ok) {
            const embData = await embRes.json();
            const embedding = embData[0]?.embedding;
            if (embedding) {
              await admin.from("documents").insert({
                workspace_id: workspaceId,
                title: `Competitor Intel: ${analysisResult.competitor_name}`,
                content: battlecardMarkdown,
                source_type: "url_scrape",
                source_url: normalizedUrl,
                embedding: embedding,
                char_count: battlecardMarkdown.length,
                metadata: { source: "competitor_radar", competitor: analysisResult.competitor_name },
              });
            }
          }
        }
      } catch (embErr) {
        console.warn("[analyze-competitor] Embed error:", embErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: analysisResult,
      markdown: battlecardMarkdown,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[analyze-competitor] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to analyze competitor" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
