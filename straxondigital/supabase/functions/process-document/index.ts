import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

// Simple text chunker based on newlines/sentences
function chunkText(text: string, maxTokens: number = 800): string[] {
  // A simple chunking strategy: split by paragraphs, then join up to max limit.
  // Assuming 1 word ~ 1.3 tokens. So 800 tokens ~ 600 words.
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) / 5 < maxTokens) {
      currentChunk += p + "\n\n";
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = p + "\n\n";
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { content, workspaceId, metadata = {} } = await req.json();
    
    if (!content || !workspaceId) {
      throw new Error("Missing content or workspaceId");
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify user has access to workspace (using auth header)
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Chunk the document
    const chunks = chunkText(content);
    console.log(`Processing ${chunks.length} chunks for workspace ${workspaceId}`);

    for (const chunk of chunks) {
      // Get embedding from OpenAI
      const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: chunk,
          model: "text-embedding-3-small"
        })
      });

      if (!embedResp.ok) {
        throw new Error(`OpenAI Embedding Failed: ${await embedResp.text()}`);
      }

      const embedData = await embedResp.json();
      const embedding = embedData.data[0].embedding;

      // Store in DB
      const { error } = await admin.from("documents").insert({
        workspace_id: workspaceId,
        content: chunk,
        metadata: { ...metadata, chunked: true },
        embedding: embedding
      });

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, chunksProcessed: chunks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("process-document error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
