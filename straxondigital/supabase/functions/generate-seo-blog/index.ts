import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const { topic, keywords } = await req.json();

    // Mock API call for the blog generation (in a real scenario, this would query OpenAI via RAG)
    const blogContent = `# ${topic}\n\n## Introduction\nIn today's fast-paced digital ecosystem, the topic of "${topic}" has never been more relevant. This article explores the nuanced strategies required to excel.\n\n## Core Concepts\nKeywords to consider: ${keywords || "Growth, Innovation, SaaS"}.\n\nWhen evaluating competitive advantages, operators must focus on recurring retention patterns.\n\n## Strategy & Execution\n1. Establish clear OKRs.\n2. Leverage AI automation for scale.\n3. Measure and iterate based on real-time telemetry.\n\n## Conclusion\nBy adopting a data-first approach, companies can outmaneuver traditional legacy systems and establish a dominant market presence.\n\n---\n*Auto-generated via StraxonSecure Content Engine*`;
    
    // Artificial delay to simulate processing
    await new Promise(r => setTimeout(r, 2000));

    return new Response(JSON.stringify({ blogContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
