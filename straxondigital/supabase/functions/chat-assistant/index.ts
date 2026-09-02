import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { query, workspaceId, history = [] } = await req.json();

    if (!query || !workspaceId) {
      throw new Error("Missing required fields: query and workspaceId");
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Check workspace Brand Brain
    const { data: brandBrain } = await admin
      .from("brand_brain")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    // 2. Compute query embedding for RAG vector search
    let ragContext = "";
    let matchedChunks: Array<{ id: string; content: string; metadata: Record<string, unknown>; similarity: number }> = [];

    if (OPENAI_API_KEY) {
      try {
        const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: query.slice(0, 2000),
            model: "text-embedding-3-small",
          }),
        });

        if (embedResp.ok) {
          const embedData = await embedResp.json();
          const queryEmbedding = embedData.data[0].embedding;

          // 3. Match nearest documents from pgvector
          const { data: docs, error: matchErr } = await admin.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_threshold: 0.30,
            match_count: 6,
            p_workspace_id: workspaceId,
          });

          if (!matchErr && docs && docs.length > 0) {
            matchedChunks = docs;
            ragContext = docs
              .map((d: any, idx: number) => {
                const src = d.metadata?.source_url || d.metadata?.title || "Knowledge Base";
                const sim = ((d.similarity || 0) * 100).toFixed(0);
                return `[Source ${idx + 1} · "${src}" · ${sim}% match]:\n${d.content}`;
              })
              .join("\n\n---\n\n");
          }
        }
      } catch (e) {
        console.warn("[chat-assistant] Embedding retrieval error:", e);
      }
    }

    // 4. Synthesize system instructions with Brand Brain + RAG Context
    let brandInstructions = "";
    if (brandBrain && brandBrain.is_configured) {
      brandInstructions = `
BRAND BRAIN IDENTITY:
- Brand Name: ${brandBrain.brand_name || "Unknown"}
- Mission: ${brandBrain.mission || "N/A"}
- Target Audience: ${brandBrain.audience || "N/A"}
- Tone: Professional (${brandBrain.tone_professional}%), Playful (${brandBrain.tone_playful}%), Bold (${brandBrain.tone_bold}%), Warm (${brandBrain.tone_warm}%)
- Rules (Must Follow): ${JSON.stringify(brandBrain.dos || [])}
- Rules (Never Do): ${JSON.stringify(brandBrain.donts || [])}
`;
    }

    // Build citation guide for the model
    const citationGuide = matchedChunks.length > 0
      ? `\nWhen referencing information from the Knowledge Base, cite the source like this: [Source 1], [Source 2], etc. Always cite when drawing from specific documents.`
      : "";

    const systemPrompt = `You are Straxon Labs' Autonomous RAG Assistant and Brand Strategist. You have semantic access to the user's uploaded Knowledge Base documents and their workspace Brand Brain.

${brandInstructions}

RETRIEVED KNOWLEDGE BASE CONTEXT (${matchedChunks.length} chunks retrieved):
${ragContext ? ragContext : "(No specific documents matched this query. Use brand guidelines and general expertise.)"}

RESPONSE GUIDELINES:
- Deliver precise, high-impact, actionable answers grounded in the retrieved knowledge.
- If referencing facts from documents, cite them as [Source N] inline.${citationGuide}
- Strictly adhere to the Brand Brain's voice, tone, dos, and donts.
- Format with clean Markdown (bullet points, bold highlights, code blocks where suitable).
- When giving recommendations, always link back to specific services or automations available.`;

    // 5. Build message history (support multi-turn conversations)
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: query },
    ];

    // 6. Call OpenAI streaming API
    const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1600,
      }),
    });

    if (!chatResp.ok) {
      const errText = await chatResp.text();
      console.error("[chat-assistant] OpenAI error:", errText);
      throw new Error(`OpenAI gateway error: ${chatResp.status}`);
    }

    // Return streaming response with citation metadata in headers
    const citationsHeader = JSON.stringify(matchedChunks.map((c, i) => ({
      id: i + 1,
      source: (c.metadata as any)?.source_url || (c.metadata as any)?.title || "Knowledge Base",
      similarity: Math.round((c.similarity || 0) * 100),
      preview: c.content.slice(0, 120) + "…",
    })));

    return new Response(chatResp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-RAG-Citations": encodeURIComponent(citationsHeader),
        "X-RAG-Chunks-Used": String(matchedChunks.length),
        "X-Brand-Brain-Active": String(!!(brandBrain?.is_configured)),
      },
    });
  } catch (err: any) {
    console.error("[chat-assistant] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to process chat" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
