import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const { topic, platform } = await req.json();

    let postContent = "";
    if (platform === "LinkedIn") {
      postContent = `🚀 **Stop doing things the hard way.**

We just analyzed the data on ${topic}, and the results are staggering.

Most founders are still relying on legacy systems, bleeding margins and losing their competitive edge.

The fix is simpler than you think:
1️⃣ Consolidate your tool stack
2️⃣ Inject AI automation at the top of the funnel
3️⃣ Let the RAG knowledge base do the heavy lifting

Drop a ♻️ if you agree, and let me know your thoughts below!

#Automation #SaaS #Growth #AI`;
    } else {
      postContent = `The secret to ${topic} isn't working harder. It's working smarter with AI.\n\nHere are 3 ways top agencies are scaling 10x faster using our automation suite 🧵👇\n\n1/ Eliminate manual lead follow-ups\n2/ Auto-generate competitive battle cards\n3/ Deploy autonomous SEO content\n\nAre you still doing this manually?`;
    }

    await new Promise(r => setTimeout(r, 2000));

    return new Response(JSON.stringify({ postContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
