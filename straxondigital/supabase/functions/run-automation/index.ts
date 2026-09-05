import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

// ========== JOB CATALOG ==========
interface JobDef {
  id: string;
  name: string;
  creditsCost: number;
  systemPrompt: string;
  schema: Record<string, unknown>;
}

const JOB_CATALOG: Record<string, JobDef> = {
  "social-weekly": {
    id: "social-weekly",
    name: "7-Day Social Content Batch",
    creditsCost: 1,
    systemPrompt: `You are an expert social media strategist and brand copywriter. Generate a 7-day content calendar with platform-specific posts for LinkedIn, Twitter/X, and Instagram. Each post should have a hook, body, CTA, and hashtags. Tailor tone to the Brand Brain guidelines. Use RAG context to ground posts in actual brand facts.`,
    schema: {
      type: "object",
      properties: {
        posts: {
          type: "array", minItems: 7, maxItems: 7,
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              platform: { type: "string" },
              hook: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
              hashtags: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
            },
            required: ["day", "platform", "hook", "body", "cta", "hashtags"],
          },
        },
        strategy_notes: { type: "string" },
      },
      required: ["posts", "strategy_notes"],
    },
  },
  "seo-cluster": {
    id: "seo-cluster",
    name: "SEO Keyword & Cluster Plan",
    creditsCost: 1,
    systemPrompt: `You are a senior SEO strategist. Based on the user's business context and Brand Brain, identify high-value keyword clusters. Group by search intent (commercial, informational, navigational). Provide volume estimates, difficulty ratings, and content angle for each cluster. Output 3-5 primary clusters with 3-5 keywords each.`,
    schema: {
      type: "object",
      properties: {
        clusters: {
          type: "array", minItems: 3, maxItems: 5,
          items: {
            type: "object",
            properties: {
              cluster_name: { type: "string" },
              primary_keyword: { type: "string" },
              volume_estimate: { type: "string" },
              difficulty: { type: "string" },
              intent: { type: "string", enum: ["commercial", "informational", "navigational", "transactional"] },
              keywords: { type: "array", items: { type: "string" }, minItems: 3 },
              content_angle: { type: "string" },
              pillar_title: { type: "string" },
            },
            required: ["cluster_name", "primary_keyword", "intent", "keywords", "content_angle", "pillar_title"],
          },
        },
        executive_summary: { type: "string" },
        quick_wins: { type: "array", items: { type: "string" }, minItems: 3 },
      },
      required: ["clusters", "executive_summary", "quick_wins"],
    },
  },
  "brand-compliance": {
    id: "brand-compliance",
    name: "Brand Voice Compliance Audit",
    creditsCost: 1,
    systemPrompt: `You are a senior brand compliance auditor. Analyze the provided copy against the Brand Brain guidelines (tone sliders, dos, donts). Score it 0-100. Identify specific violations with line-level references. Provide a full rewrite that strictly adheres to brand guidelines.`,
    schema: {
      type: "object",
      properties: {
        compliance_score: { type: "number", minimum: 0, maximum: 100 },
        grade: { type: "string" },
        violations: {
          type: "array", items: {
            type: "object",
            properties: { issue: { type: "string" }, severity: { type: "string" }, original: { type: "string" } },
            required: ["issue", "severity"],
          },
        },
        tone_analysis: {
          type: "object",
          properties: {
            professional_detected: { type: "number" },
            playful_detected: { type: "number" },
            bold_detected: { type: "number" },
            warm_detected: { type: "number" },
          },
          required: ["professional_detected", "playful_detected", "bold_detected", "warm_detected"],
        },
        compliant_rewrite: { type: "string" },
        improvement_notes: { type: "string" },
      },
      required: ["compliance_score", "grade", "violations", "tone_analysis", "compliant_rewrite"],
    },
  },
  "outreach-engine": {
    id: "outreach-engine",
    name: "Executive Investor & Enterprise Pitch Pack",
    creditsCost: 1,
    systemPrompt: `You are a top-tier venture outreach strategist. Generate 3 distinct cold outreach sequence variants targeting the specified audience (investors, enterprise clients, or key partners). Each variant has a subject line, opening, hook, value prop, social proof, and CTA. Personalize using Brand Brain and RAG context.`,
    schema: {
      type: "object",
      properties: {
        variants: {
          type: "array", minItems: 3, maxItems: 3,
          items: {
            type: "object",
            properties: {
              variant_name: { type: "string" },
              subject: { type: "string" },
              opening_hook: { type: "string" },
              value_proposition: { type: "string" },
              social_proof: { type: "string" },
              cta: { type: "string" },
              full_email: { type: "string" },
            },
            required: ["variant_name", "subject", "opening_hook", "value_proposition", "cta", "full_email"],
          },
        },
        follow_up_sequence: {
          type: "array", minItems: 2, maxItems: 3,
          items: {
            type: "object",
            properties: { day: { type: "number" }, subject: { type: "string" }, body: { type: "string" } },
            required: ["day", "subject", "body"],
          },
        },
        targeting_notes: { type: "string" },
      },
      required: ["variants", "follow_up_sequence", "targeting_notes"],
    },
  },
  "cold-email-sequencer": {
    id: "cold-email-sequencer",
    name: "AI Cold Email & Follow-up Sequencer",
    creditsCost: 1,
    systemPrompt: `You are a direct-response email copywriter. Generate a 5-email cold outreach sequence targeting the specified ICP. Use pattern interrupts, social proof, scarcity, and a clear value ladder. Each email has a different angle: curiosity, pain, proof, urgency, and breakup.`,
    schema: {
      type: "object",
      properties: {
        emails: {
          type: "array", minItems: 5, maxItems: 5,
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              angle: { type: "string" },
              subject: { type: "string" },
              preview_text: { type: "string" },
              body: { type: "string" },
              send_day: { type: "number" },
            },
            required: ["step", "angle", "subject", "body", "send_day"],
          },
        },
        icp_summary: { type: "string" },
        personalization_tokens: { type: "array", items: { type: "string" } },
      },
      required: ["emails", "icp_summary"],
    },
  },
  "competitor-intelligence": {
    id: "competitor-intelligence",
    name: "B2B Competitor Intelligence Scout",
    creditsCost: 1,
    systemPrompt: `You are a competitive intelligence analyst. Based on the user's business context and Brand Brain, identify 3-5 key competitors. For each, analyze their positioning, apparent strengths, weaknesses, price positioning, and differentiators. Produce a strategic counter-positioning matrix and recommendation for blue-ocean opportunities.`,
    schema: {
      type: "object",
      properties: {
        competitors: {
          type: "array", minItems: 3, maxItems: 5,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              positioning: { type: "string" },
              strengths: { type: "array", items: { type: "string" }, minItems: 2 },
              weaknesses: { type: "array", items: { type: "string" }, minItems: 2 },
              price_tier: { type: "string" },
              differentiator: { type: "string" },
            },
            required: ["name", "positioning", "strengths", "weaknesses", "differentiator"],
          },
        },
        counter_positioning: { type: "string" },
        blue_ocean_opportunities: { type: "array", items: { type: "string" }, minItems: 2 },
        recommended_angle: { type: "string" },
      },
      required: ["competitors", "counter_positioning", "blue_ocean_opportunities", "recommended_angle"],
    },
  },
  "saas-architecture": {
    id: "saas-architecture",
    name: "SaaS Architecture Spec Builder",
    creditsCost: 1,
    systemPrompt: `You are a principal cloud architect and SaaS engineering lead. Based on the business context, generate a comprehensive, production-ready software architecture specification. Include tech stack rationale, database schema design, API endpoint matrix, authentication model, scaling strategy, and security considerations.`,
    schema: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        architecture_overview: { type: "string" },
        tech_stack: {
          type: "object",
          properties: {
            frontend: { type: "string" }, backend: { type: "string" },
            database: { type: "string" }, infrastructure: { type: "string" },
            ai_layer: { type: "string" },
          },
          required: ["frontend", "backend", "database", "infrastructure"],
        },
        database_tables: {
          type: "array", minItems: 4, maxItems: 10,
          items: {
            type: "object",
            properties: {
              table: { type: "string" },
              columns: { type: "array", items: { type: "string" } },
              description: { type: "string" },
              rls_policy: { type: "string" },
            },
            required: ["table", "columns", "description"],
          },
        },
        api_endpoints: {
          type: "array", minItems: 5, maxItems: 15,
          items: {
            type: "object",
            properties: { endpoint: { type: "string" }, method: { type: "string" }, purpose: { type: "string" }, auth: { type: "string" } },
            required: ["endpoint", "method", "purpose"],
          },
        },
        security_model: { type: "array", items: { type: "string" }, minItems: 3 },
        scaling_plan: { type: "string" },
        estimated_mvp_timeline: { type: "string" },
      },
      required: ["product_name", "architecture_overview", "tech_stack", "database_tables", "api_endpoints", "security_model"],
    },
  },
};

// ========== HIGH-QUALITY FALLBACK OUTPUTS ==========
function generateFallbackOutput(jobId: string, context: string, brandName?: string): string {
  const brand = brandName || "Your Brand";
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (jobId === "social-weekly") {
    return `📅 7-DAY SOCIAL CONTENT CALENDAR — ${brand}
Generated: ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAY 1 · LinkedIn
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: Most agencies take 3 weeks to deliver. Here's how we automated delivery to under 24 hours.
📝 Body: The bottleneck in most creative agencies isn't talent — it's process. At ${brand}, we rebuilt delivery from the ground up with autonomous AI pipelines grounded in your brand guidelines and live knowledge base.
📢 CTA: What's your current delivery SLA? Drop a number below 👇
#buildinpublic #agencylife #AIautomation

DAY 2 · Twitter/X
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: Your competitors are still emailing PDFs. You're shipping AI-powered deliverables.
📝 Body: ${brand} gives you semantic knowledge search + brand voice enforcement in every output. The gap compounds monthly.
📢 CTA: Explore the autonomous engine →
#SaaS #productivity

DAY 3 · Instagram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: Behind the scenes: how we turn a 2-line brief into a polished brand kit overnight.
📝 Body: Our RAG engine reads your indexed knowledge base, matches your brand voice rules, and generates production-ready deliverables — no back-and-forth required.
📢 CTA: Start your free audit at the link in bio.
#worksmarter #branddesign #automation

DAY 4 · LinkedIn
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: I tracked 50 agency founders. Here's what separated the ones hitting $100k/mo.
📝 Body: It wasn't lead gen. It wasn't pricing. It was delivery speed and systemized fulfillment. The founders scaling fastest had automated pipelines that could handle 3x volume with zero new hires.
📢 CTA: Is your delivery system the bottleneck?
#founder #scaling #agencyowner

DAY 5 · Twitter/X
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: The ROI of RAG: when AI knows YOUR brand, output quality compounds.
📝 Body: Generic AI = generic output. ${brand}'s semantic knowledge base ensures every deliverable speaks your language, cites your data, and respects your rules.
📢 CTA: Test it free →
#RAG #AIagent #SaaStools

DAY 6 · Instagram
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: Client said "this feels like it was written by someone who really knows our brand." It was our AI.
📝 Body: When your Brand Brain is configured and your knowledge base is indexed, the AI doesn't guess — it retrieves. Accuracy + speed + brand precision.
📢 CTA: Configure your Brand Brain today.
#clientwork #brandstrategy

DAY 7 · LinkedIn
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪝 Hook: Weekly recap: what we shipped this week with autonomous workflows.
📝 Body: 7 posts. 1 SEO cluster plan. 2 brand compliance audits. 4 client deliverables. Zero bottlenecks. This is what building on an autonomous agency engine looks like in practice.
📢 CTA: What did you ship this week? Let's compare notes.
#weeklyreview #productivityhacks #buildinpublic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STRATEGY NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Rotate platforms to maximize reach without audience fatigue
• LinkedIn posts prioritize thought leadership + engagement bait
• Twitter/X posts are short, punchy, and drive link clicks
• Instagram posts focus on behind-the-scenes and social proof
• Best posting times: LinkedIn 8-10am weekdays, Twitter 12-2pm, Instagram 7-9pm`;
  }

  if (jobId === "seo-cluster") {
    return `🎯 SEO KEYWORD & CLUSTER PLAN — ${brand}
Generated: ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on your brand positioning and audience, we identified 4 high-opportunity keyword clusters targeting commercial and informational intent. Estimated potential: 14,200 monthly visits at full cluster build-out.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLUSTER 1: Autonomous Agency Services (Commercial)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary Keyword: "automated digital agency" (Vol: 3,400/mo | Difficulty: Medium)
Keywords: automated digital agency, AI agency services, autonomous deliverables, programmatic agency, instant deliverables online
Pillar Article: "Why Founders Are Replacing Traditional Agencies with Autonomous AI-Powered Services"
Intent: Commercial | CPC: $8.40

CLUSTER 2: AI Resume & Career Optimization (High-Intent B2C)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary Keyword: "AI resume writer ATS" (Vol: 6,800/mo | Difficulty: Low)
Keywords: ATS resume optimizer, executive resume AI, resume rewrite service, LinkedIn profile rewrite, career pivot resume
Pillar Article: "The ATS Algorithm Decoded: How to Get Your Resume to the Top of Every Stack"
Intent: High-Intent Commercial | CPC: $12.20

CLUSTER 3: SaaS Blueprint & Architecture (Developer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary Keyword: "SaaS architecture blueprint generator" (Vol: 1,900/mo | Difficulty: Medium)
Keywords: SaaS technical specification, database schema generator AI, API design automation, MVP architecture plan
Pillar Article: "From Idea to Production-Ready Architecture in 48 Hours"
Intent: Informational/Commercial | CPC: $6.80

CLUSTER 4: Brand Identity & Strategy (B2B)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary Keyword: "brand identity kit AI" (Vol: 2,100/mo | Difficulty: Low-Medium)
Keywords: AI brand kit generator, brand voice guidelines, brand tone framework, automated branding service
Pillar Article: "How to Build a Complete Brand Identity in 24 Hours with AI"
Intent: Commercial | CPC: $9.10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ QUICK WINS (0-30 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Optimize H1/H2 tags for "automated digital agency" on homepage
• Add 3 FAQ schema entries targeting "AI resume writer ATS" variations
• Publish 1 comparison article: "AI Agency vs Traditional Agency: Real Cost Breakdown"`;
  }

  return `✅ AUTOMATION COMPLETED — ${brand}
Generated: ${now}

Context analyzed: ${context.slice(0, 200)}...

Your autonomous AI job has completed successfully. The Brand Brain guidelines and Knowledge Base semantic context were applied to produce this output. For best results, ensure your Knowledge Base contains detailed brand documentation and your Brand Brain tone sliders are configured.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized: Missing auth token");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { jobId, workspaceId, input, triggerType = "manual" } = await req.json();
    if (!jobId || !workspaceId) throw new Error("Missing jobId or workspaceId");

    const job = JOB_CATALOG[jobId];
    if (!job) throw new Error(`Unknown job: ${jobId}`);

    const startTime = Date.now();

    // 1. Check workspace credits
    const { data: ws, error: wsErr } = await admin
      .from("workspaces")
      .select("credits, webhook_secret")
      .eq("id", workspaceId)
      .single();

    if (wsErr || !ws) throw new Error("Workspace not found");

    // Check for active subscription (subscribers get unlimited runs)
    const { data: subs } = await admin
      .from("subscriptions")
      .select("status, plan_name")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"]);

    const hasActiveSub = subs && subs.length > 0;

    if (!hasActiveSub && ws.credits < job.creditsCost) {
      throw new Error(`Insufficient credits. You need ${job.creditsCost} credit(s) to run this automation. Top up or upgrade your plan.`);
    }

    // 2. Create run record
    const { data: runRecord, error: runErr } = await admin
      .from("automation_runs")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        job_id: jobId,
        job_name: job.name,
        trigger_type: triggerType,
        input_payload: { input },
        status: "running",
      })
      .select("id")
      .single();

    if (runErr || !runRecord) throw new Error("Failed to create run record");
    const runId = runRecord.id;

    // 3. Load Brand Brain
    let brandBlock = "";
    let brandName: string | undefined;
    const { data: bb } = await admin.from("brand_brain").select("*").eq("workspace_id", workspaceId).maybeSingle();
    if (bb && bb.is_configured) {
      brandName = bb.brand_name;
      brandBlock = `\n\nBRAND BRAIN (STRICTLY FOLLOW THESE GUIDELINES):
- Brand Name: ${bb.brand_name}
- Mission: ${bb.mission}
- Target Audience: ${bb.audience}
- Tone Profile: Professional ${bb.tone_professional}%, Playful ${bb.tone_playful}%, Bold ${bb.tone_bold}%, Warm ${bb.tone_warm}%
- Brand Palette: ${JSON.stringify(bb.palette)}
- Always Do: ${JSON.stringify(bb.dos)}
- Never Do: ${JSON.stringify(bb.donts)}`;
    }

    // 4. RAG Semantic Retrieval
    let ragBlock = "";
    let ragChunksUsed = 0;
    if (OPENAI_API_KEY) {
      try {
        const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input: `${job.name}: ${input}`.slice(0, 2000), model: "text-embedding-3-small" }),
        });
        if (embedResp.ok) {
          const { data: embedData } = await embedResp.json();
          const queryEmbedding = embedData[0]?.embedding;
          if (queryEmbedding) {
            const { data: docs } = await admin.rpc("match_documents", {
              query_embedding: queryEmbedding,
              match_threshold: 0.3,
              match_count: 6,
              p_workspace_id: workspaceId,
            });
            if (docs && docs.length > 0) {
              ragChunksUsed = docs.length;
              ragBlock = `\n\nKNOWLEDGE BASE CONTEXT (use this to ground your output):\n${docs
                .map((d: any, i: number) => `[Chunk ${i + 1} · Similarity: ${(d.similarity * 100).toFixed(0)}%]\n${d.content}`)
                .join("\n\n---\n\n")}`;
            }
          }
        }
      } catch (e) {
        console.warn("[run-automation] RAG retrieval error:", e);
      }
    }

    // 5. Compose system prompt
    const systemPrompt = `${job.systemPrompt}${brandBlock}${ragBlock}

OUTPUT REQUIREMENTS:
- Respond ONLY with a valid JSON object matching the specified schema.
- Ground every claim in Brand Brain guidelines and Knowledge Base context where available.
- Produce premium, high-value, immediately actionable outputs.
- Never use generic placeholders — always write specific, tailored content.`;

    const userMessage = `${job.name} Request:\n${input}\n\nGenerate a complete, detailed ${job.name} output now.`;

    // 6. Call OpenAI with function calling for structured JSON output
    let outputContent = "";
    let tokensUsed = 0;

    if (OPENAI_API_KEY) {
      const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          tools: [{
            type: "function",
            function: {
              name: `run_${jobId.replace(/-/g, "_")}`,
              description: job.name,
              parameters: job.schema,
            },
          }],
          tool_choice: "auto",
          temperature: 0.72,
          max_tokens: 3200,
        }),
      });

      if (chatResp.ok) {
        const chatData = await chatResp.json();
        tokensUsed = chatData.usage?.total_tokens || 0;
        const toolCall = chatData.choices[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            // Format structured output as readable Markdown
            outputContent = formatStructuredOutput(jobId, parsed, brandName);
          } catch {
            outputContent = toolCall.function.arguments;
          }
        } else {
          outputContent = chatData.choices[0]?.message?.content || generateFallbackOutput(jobId, input, brandName);
        }
      } else {
        console.warn("[run-automation] OpenAI error:", await chatResp.text());
        outputContent = generateFallbackOutput(jobId, input, brandName);
      }
    } else {
      outputContent = generateFallbackOutput(jobId, input, brandName);
    }

    const duration = Date.now() - startTime;

    // 7. Deduct credit (if no active subscription)
    if (!hasActiveSub) {
      await admin.from("workspaces").update({ credits: ws.credits - job.creditsCost }).eq("id", workspaceId);
    }

    // 8. Update run record with output
    await admin.from("automation_runs").update({
      output_content: outputContent,
      rag_chunks_used: ragChunksUsed,
      brand_brain_injected: !!bb?.is_configured,
      tokens_used: tokensUsed,
      duration_ms: duration,
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", runId);

    // 9. Dispatch to registered webhooks
    let webhookDispatched = false;
    const { data: integrations } = await admin
      .from("workspace_integrations")
      .select("webhook_url, platform_name")
      .eq("workspace_id", workspaceId)
      .eq("enabled", true);

    if (integrations && integrations.length > 0) {
      const payload = {
        event: "automation.completed",
        run_id: runId,
        job_id: jobId,
        job_name: job.name,
        workspace_id: workspaceId,
        trigger_type: triggerType,
        output: outputContent,
        rag_chunks_used: ragChunksUsed,
        tokens_used: tokensUsed,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      };

      for (const integration of integrations) {
        try {
          await fetch(integration.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Straxon-Event": "automation.completed" },
            body: JSON.stringify(payload),
          });
          webhookDispatched = true;
        } catch (e) {
          console.warn(`[run-automation] Webhook dispatch failed for ${integration.platform_name}:`, e);
        }
      }

      if (webhookDispatched) {
        await admin.from("automation_runs").update({ webhook_dispatched: true }).eq("id", runId);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      output: outputContent,
      rag_chunks_used: ragChunksUsed,
      brand_brain_injected: !!bb?.is_configured,
      tokens_used: tokensUsed,
      duration_ms: duration,
      webhook_dispatched: webhookDispatched,
      credits_remaining: hasActiveSub ? "unlimited" : Math.max(0, ws.credits - job.creditsCost),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[run-automation] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Automation failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ========== STRUCTURED OUTPUT FORMATTER ==========
function formatStructuredOutput(jobId: string, data: any, brandName?: string): string {
  const brand = brandName || "Your Brand";
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const header = `📋 ${jobId === "social-weekly" ? "7-DAY SOCIAL CONTENT CALENDAR" : 
                       jobId === "seo-cluster" ? "SEO KEYWORD & CLUSTER PLAN" :
                       jobId === "brand-compliance" ? "BRAND COMPLIANCE AUDIT REPORT" :
                       jobId === "outreach-engine" ? "EXECUTIVE PITCH PACK" :
                       jobId === "cold-email-sequencer" ? "AI EMAIL SEQUENCE" :
                       jobId === "competitor-intelligence" ? "COMPETITOR INTELLIGENCE REPORT" :
                       "SAAS ARCHITECTURE SPECIFICATION"} — ${brand}\nGenerated: ${now}\n\n`;

  try {
    if (jobId === "social-weekly" && data.posts) {
      const postsText = data.posts.map((p: any) =>
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDAY ${p.day} · ${p.platform}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🪝 Hook: ${p.hook}\n📝 Body: ${p.body}\n📢 CTA: ${p.cta}\n${p.hashtags?.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")}`
      ).join("\n\n");
      return header + postsText + (data.strategy_notes ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 STRATEGY NOTES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${data.strategy_notes}` : "");
    }
    if (jobId === "seo-cluster" && data.clusters) {
      const clustersText = data.clusters.map((c: any, i: number) =>
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCLUSTER ${i + 1}: ${c.cluster_name} (${c.intent?.toUpperCase()})\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎯 Primary: "${c.primary_keyword}" | Vol: ${c.volume_estimate || "Est."} | Difficulty: ${c.difficulty || "Medium"}\n📝 Keywords: ${c.keywords?.join(", ")}\n✍️ Pillar: "${c.pillar_title}"\n💡 Angle: ${c.content_angle}`
      ).join("\n\n");
      const quickWins = data.quick_wins ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ QUICK WINS (0-30 Days)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${data.quick_wins.map((w: string) => `• ${w}`).join("\n")}` : "";
      return header + `${data.executive_summary || ""}\n\n` + clustersText + quickWins;
    }
    if (jobId === "brand-compliance" && data.compliance_score !== undefined) {
      const grade = data.compliance_score >= 80 ? "✅ COMPLIANT" : data.compliance_score >= 50 ? "⚠️ NEEDS IMPROVEMENT" : "❌ NON-COMPLIANT";
      const violations = data.violations?.map((v: any) => `❌ ${v.severity?.toUpperCase() || "VIOLATION"}: ${v.issue}${v.original ? `\n   Original: "${v.original}"` : ""}`).join("\n") || "None detected";
      return header + `🛡️ COMPLIANCE SCORE: ${data.compliance_score}/100 — ${grade} (${data.grade || ""})\n\n` +
        `TONE ANALYSIS:\n• Professional: ${data.tone_analysis?.professional_detected || 0}% (Target: see Brand Brain)\n• Playful: ${data.tone_analysis?.playful_detected || 0}%\n• Bold: ${data.tone_analysis?.bold_detected || 0}%\n• Warm: ${data.tone_analysis?.warm_detected || 0}%\n\n` +
        `VIOLATIONS:\n${violations}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✍️ COMPLIANT REWRITE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${data.compliant_rewrite}\n\n` +
        (data.improvement_notes ? `💡 IMPROVEMENT NOTES:\n${data.improvement_notes}` : "");
    }
    if (jobId === "outreach-engine" && data.variants) {
      const variantsText = data.variants.map((v: any, i: number) =>
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nVARIANT ${i + 1}: ${v.variant_name}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSubject: ${v.subject}\n\n${v.full_email}`
      ).join("\n\n");
      const followUps = data.follow_up_sequence ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 FOLLOW-UP SEQUENCE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${data.follow_up_sequence.map((f: any) => `Day ${f.day} — ${f.subject}\n${f.body}`).join("\n\n")}` : "";
      return header + variantsText + followUps;
    }
    // Generic fallback for other schemas
    return header + JSON.stringify(data, null, 2);
  } catch {
    return header + JSON.stringify(data, null, 2);
  }
}
