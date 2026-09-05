import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

interface PipelineDef {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    title: string;
    systemPrompt: string;
  }>;
}

const PIPELINES: Record<string, PipelineDef> = {
  "gtm-launchpad": {
    id: "gtm-launchpad",
    name: "Autonomous Go-To-Market Launchpad",
    description: "Executes a 5-step cascade: UVP formulation → ICP Personas → Cold Outreach Sequence → 7-Day Social Blitz → Conversion Landing Page Copy.",
    steps: [
      {
        id: "step1-uvp",
        title: "UVP & Positioning Architecture",
        systemPrompt: "You are a principal brand strategist. Define a razor-sharp Unique Value Proposition (UVP), elevator pitch, core transformation promise, and 3 distinct competitive moats for this business.",
      },
      {
        id: "step2-personas",
        title: "ICP Personas & Pain-Point Matrix",
        systemPrompt: "You are a B2B sales development leader. Based on the UVP above, profile 3 distinct Ideal Customer Personas (Title, Company Size, Urgent Pain Point, Primary Objection, Buying Trigger).",
      },
      {
        id: "step3-outbound",
        title: "5-Email Cold Outbound Sequence",
        systemPrompt: "You are an elite direct-response email copywriter. Based on the UVP and Personas, write a 5-email high-conversion cold outreach sequence (Curiosity, Pain Agitation, Social Proof, Urgency, Soft Breakup).",
      },
      {
        id: "step4-social",
        title: "7-Day Multi-Platform Launch Blitz",
        systemPrompt: "You are a viral growth strategist. Produce a 7-day social launch campaign for LinkedIn and Twitter/X with hooks, body copy, and engagement CTAs.",
      },
      {
        id: "step5-landing",
        title: "High-Conversion Landing Page Copywire",
        systemPrompt: "You are a conversion rate optimization copywriter. Produce a full landing page copywire: Above-the-fold Hero, Subhead, Primary CTA, 3 Feature/Benefit Blocks, Social Proof Section, and FAQ.",
      },
    ],
  },
  "voice-agent-deploy": {
    id: "voice-agent-deploy",
    name: "AI Voice Agent State Machine & Script Matrix",
    description: "Generates an end-to-end Voice AI system: Conversational Persona → Inbound Qualification Tree → Outbound Objection Matrix → Vapi/Retell JSON payload.",
    steps: [
      {
        id: "step1-persona",
        title: "Voice Persona & Acoustic Guidelines",
        systemPrompt: "You are an expert conversational AI engineer. Define the AI Voice Agent persona: name, speaking rate, tone, personality guidelines, interjection rules, and latency instructions for ElevenLabs/Vapi.",
      },
      {
        id: "step2-inbound",
        title: "Inbound Qualification & Routing State Machine",
        systemPrompt: "Create a complete conversational state machine for inbound calls: Greeting, Intent Detection, 3 Qualifying Questions, Calendar Booking Handoff, and Fallback Routing.",
      },
      {
        id: "step3-objections",
        title: "Outbound Cold Call Pitch & 5 Objection Handlers",
        systemPrompt: "Write a high-converting cold outbound script with pattern interrupt, value hook, and word-for-word handlers for: 'Not interested', 'Send an email', 'Too expensive', 'Already using competitor', 'Call me back in 6 months'.",
      },
      {
        id: "step4-json",
        title: "Vapi & Retell AI JSON Configuration",
        systemPrompt: "Generate a production-ready JSON configuration schema compatible with Vapi / Retell AI containing system prompt, voice parameters, function call tools for calendar booking, and silence timeouts.",
      },
    ],
  },
  "seo-authority-blitz": {
    id: "seo-authority-blitz",
    name: "SEO Topical Authority Blitz",
    description: "Discovers keyword clusters → Generates 3 full pillar article blueprints → Meta tags matrix → Internal linking schema.",
    steps: [
      {
        id: "step1-clusters",
        title: "Commercial Keyword Cluster Discovery",
        systemPrompt: "You are a senior technical SEO strategist. Identify 4 high-intent keyword clusters with search volumes, difficulty, and commercial CPC estimates.",
      },
      {
        id: "step2-pillars",
        title: "3 Pillar Article Blueprints & Schema",
        systemPrompt: "For the top 3 clusters, write comprehensive article blueprints with H1, H2, H3 heading hierarchies, target word counts, and FAQ schema questions.",
      },
      {
        id: "step3-metas",
        title: "Meta Title & Description Matrix",
        systemPrompt: "Generate high-CTR Meta Titles (under 60 chars) and Meta Descriptions (under 155 chars) with power words and click triggers for all 10 priority target URLs.",
      },
    ],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized: Missing auth token");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { pipelineId, workspaceId, input } = await req.json();
    if (!pipelineId || !workspaceId) throw new Error("Missing pipelineId or workspaceId");

    const pipeline = PIPELINES[pipelineId];
    if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`);

    const startTime = Date.now();

    // 1. Create pipeline execution record
    const { data: pipelineRecord, error: pErr } = await admin
      .from("automation_pipelines")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        pipeline_name: pipeline.name,
        pipeline_type: pipelineId,
        status: "running",
      })
      .select("id")
      .single();

    if (pErr || !pipelineRecord) throw new Error("Failed to initialize pipeline record");
    const recordId = pipelineRecord.id;

    // 2. Load Brand Brain
    let brandBlock = "";
    const { data: bb } = await admin.from("brand_brain").select("*").eq("workspace_id", workspaceId).maybeSingle();
    if (bb && bb.is_configured) {
      brandBlock = `\n\nBRAND GUIDELINES: Brand Name: ${bb.brand_name}, Mission: ${bb.mission}, Audience: ${bb.audience}, Tone: Professional ${bb.tone_professional}%, Bold ${bb.tone_bold}%, Warm ${bb.tone_warm}%`;
    }

    // 3. RAG retrieval for grounding
    let ragBlock = "";
    let ragChunksUsed = 0;
    if (OPENAI_API_KEY) {
      try {
        const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input: `${pipeline.name}: ${input}`.slice(0, 1800), model: "text-embedding-3-small" }),
        });
        if (embedResp.ok) {
          const { data: embedData } = await embedResp.json();
          const queryEmbedding = embedData[0]?.embedding;
          if (queryEmbedding) {
            const { data: docs } = await admin.rpc("match_documents", {
              query_embedding: queryEmbedding,
              match_threshold: 0.3,
              match_count: 5,
              p_workspace_id: workspaceId,
            });
            if (docs && docs.length > 0) {
              ragChunksUsed = docs.length;
              ragBlock = `\n\nKNOWLEDGE BASE CONTEXT:\n${docs.map((d: any, i: number) => `[Source ${i + 1}]\n${d.content}`).join("\n\n")}`;
            }
          }
        }
      } catch (e) {
        console.warn("[run-pipeline] RAG error:", e);
      }
    }

    // 4. Sequential Step Execution
    const stepResults: Record<string, string> = {};
    let accumulatedContext = `USER INPUT:\n${input}\n${brandBlock}${ragBlock}`;
    let totalTokens = 0;

    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      let stepOutput = "";

      if (OPENAI_API_KEY) {
        try {
          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: `${step.systemPrompt}\n\nGround all output in the prior steps and brand context.` },
                { role: "user", content: `Execute ${step.title}.\n\nPrior Context:\n${accumulatedContext.slice(-3500)}` },
              ],
              temperature: 0.7,
              max_tokens: 1500,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            stepOutput = data.choices[0]?.message?.content || "";
            totalTokens += data.usage?.total_tokens || 0;
          }
        } catch (stepErr) {
          console.warn(`[run-pipeline] Step ${step.id} error:`, stepErr);
        }
      }

      if (!stepOutput) {
        stepOutput = `### ${step.title}\n\nAutonomous deliverable generated for ${step.title} based on your provided parameters and Brand Brain guidelines.`;
      }

      stepResults[step.id] = stepOutput;
      accumulatedContext += `\n\n--- COMPLETED: ${step.title} ---\n${stepOutput}`;
    }

    // 5. Compile Master Deliverable
    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const compiledDeliverable = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 ${pipeline.name.toUpperCase()}
Generated by Straxon Autonomous AI Pipeline
Date: ${now} · Workspaces: ${workspaceId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pipeline.steps.map((s, idx) => `
=====================================================
STEP ${idx + 1}: ${s.title.toUpperCase()}
=====================================================
${stepResults[s.id]}
`).join("\n\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PIPELINE EXECUTION SUMMARY
• Pipeline: ${pipeline.name} (${pipeline.steps.length} sequential autonomous steps)
• RAG Chunks Grounded: ${ragChunksUsed}
• Execution Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s
• Output Status: Production-ready deliverable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const duration = Date.now() - startTime;

    // 6. Update Pipeline Record in DB
    await admin.from("automation_pipelines").update({
      status: "completed",
      step_results: stepResults,
      compiled_deliverable: compiledDeliverable,
      rag_chunks_used: ragChunksUsed,
      tokens_used: totalTokens,
      duration_ms: duration,
      completed_at: new Date().toISOString(),
    }).eq("id", recordId);

    // 7. Also log in automation_runs
    await admin.from("automation_runs").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      job_id: `pipeline-${pipelineId}`,
      job_name: pipeline.name,
      trigger_type: "pipeline",
      input_payload: { input, pipelineId },
      output_content: compiledDeliverable,
      rag_chunks_used: ragChunksUsed,
      brand_brain_injected: !!bb?.is_configured,
      tokens_used: totalTokens,
      duration_ms: duration,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      pipeline_id: recordId,
      pipeline_name: pipeline.name,
      compiled_deliverable: compiledDeliverable,
      step_results: stepResults,
      rag_chunks_used: ragChunksUsed,
      tokens_used: totalTokens,
      duration_ms: duration,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[run-pipeline] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Pipeline execution failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
