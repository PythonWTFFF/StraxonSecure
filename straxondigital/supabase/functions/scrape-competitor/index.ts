import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const { competitorUrl } = await req.json();

    const battleCard = `📊 **Competitor Intelligence Report: ${competitorUrl}**

**1. Estimated Pricing & Tiers**
- Basic: ~$49/mo (Limited features)
- Pro: ~$99/mo
- Enterprise: "Contact Sales" (Likely $500+)

**2. Key Strengths**
- Strong brand recognition in the legacy market.
- Extensive 3rd-party integrations out-of-the-box.

**3. Critical Weaknesses**
- No automated AI RAG capabilities.
- Poor mobile responsiveness.
- Slow customer support SLAs (48h+).

**4. Our Counter-Proposal (How to win)**
- Emphasize our 24h AI-driven turnaround time.
- Highlight the integrated Lead Magnet chat widget.
- Offer our "Pro Operator" plan which is 50% cheaper but includes autonomous RAG features they lack.`;

    // Artificial delay to simulate scraping
    await new Promise(r => setTimeout(r, 3000));

    return new Response(JSON.stringify({ battleCard }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
