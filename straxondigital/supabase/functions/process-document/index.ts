import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

// ========== TEXT CHUNKER ==========
function chunkText(text: string, maxChars: number = 3200): string[] {
  // Split by paragraphs, join up to max char limit per chunk
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length + 2) <= maxChars) {
      currentChunk += p + "\n\n";
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      // If paragraph itself is too long, split it at sentence level
      if (p.length > maxChars) {
        const sentences = p.split(/(?<=[.!?])\s+/);
        let sentChunk = "";
        for (const s of sentences) {
          if ((sentChunk.length + s.length) <= maxChars) {
            sentChunk += s + " ";
          } else {
            if (sentChunk.trim()) chunks.push(sentChunk.trim());
            sentChunk = s + " ";
          }
        }
        if (sentChunk.trim()) currentChunk = sentChunk.trim() + "\n\n";
        else currentChunk = "";
      } else {
        currentChunk = p + "\n\n";
      }
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.filter(c => c.length > 30);
}

// ========== URL SCRAPER ==========
async function scrapeUrl(url: string): Promise<{ text: string; title: string }> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; StraxonBot/1.0; +https://straxon.digital)",
      "Accept": "text/html,application/xhtml+xml,*/*",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!resp.ok) throw new Error(`Failed to fetch URL: ${resp.status} ${resp.statusText}`);

  const contentType = resp.headers.get("content-type") || "";

  // Handle plain text / markdown
  if (contentType.includes("text/plain") || contentType.includes("text/markdown")) {
    const text = await resp.text();
    return { text: text.slice(0, 60000), title: url };
  }

  // Handle HTML
  const html = await resp.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : url;

  // Remove scripts, styles, nav, footer, header, aside
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Collapse multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return { text: cleaned.slice(0, 60000), title };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const { workspaceId, metadata = {} } = body;
    if (!workspaceId) throw new Error("Missing workspaceId");

    let content: string;
    let sourceType: string;
    let sourceUrl: string | undefined;
    let docTitle: string;

    // ---- Determine ingestion mode ----
    if (body.url) {
      // URL Scraping Mode
      sourceType = "url_scrape";
      sourceUrl = body.url;
      const scraped = await scrapeUrl(body.url);
      content = scraped.text;
      docTitle = metadata.title || scraped.title;
    } else if (body.content) {
      // Manual text / file content mode
      content = body.content;
      sourceType = body.sourceType || "manual";
      docTitle = metadata.title || content.substring(0, 60).replace(/\n/g, " ") + "…";
    } else {
      throw new Error("Must provide either 'url' or 'content'");
    }

    if (!content.trim()) throw new Error("Content is empty after processing");

    // Chunk the document
    const chunks = chunkText(content);
    console.log(`[process-document] Processing ${chunks.length} chunks (source: ${sourceType}) for workspace ${workspaceId}`);

    let processedChunks = 0;
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];

      // Generate embedding
      const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: chunk,
          model: "text-embedding-3-small",
        }),
      });

      if (!embedResp.ok) {
        const errText = await embedResp.text();
        throw new Error(`OpenAI Embedding Failed (chunk ${chunkIndex}): ${errText}`);
      }

      const embedData = await embedResp.json();
      const embedding = embedData.data[0].embedding;

      // Store in DB
      const { error } = await admin.from("documents").insert({
        workspace_id: workspaceId,
        content: chunk,
        title: docTitle,
        source_type: sourceType,
        source_url: sourceUrl || null,
        char_count: chunk.length,
        chunk_index: chunkIndex,
        metadata: {
          ...metadata,
          title: docTitle,
          source_type: sourceType,
          source_url: sourceUrl,
          chunk_index: chunkIndex,
          total_chunks: chunks.length,
          char_count: chunk.length,
        },
        embedding,
      });

      if (error) throw error;
      processedChunks++;
    }

    return new Response(JSON.stringify({
      success: true,
      chunksProcessed: processedChunks,
      totalChunks: chunks.length,
      sourceType,
      sourceUrl,
      title: docTitle,
      charCount: content.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[process-document] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to process document" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
