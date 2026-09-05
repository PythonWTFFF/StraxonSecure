import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const { leadProfile, goal } = await req.json();

    const campaign = `**Email 1: The Hook (Day 1)**
Subject: Quick question about your growth
Hi there,
I noticed you're scaling in the ${leadProfile} space. Our agency specializes in helping similar founders achieve [${goal}]. Are you open to a quick chat?

---

**Email 2: The Value Add (Day 3)**
Subject: How [Top Competitor] achieved ${goal}
Hi again,
I wanted to share a quick case study on how a similar company used our automated system to double their throughput. Here's a brief ROI breakdown...

---

**Email 3: The Call to Action (Day 5)**
Subject: Worth a 15-min chat?
Hey, just bubbling this up to the top of your inbox. If you're serious about [${goal}], let's connect. You can book a time here: [Link]`;

    // Artificial delay to simulate processing
    await new Promise(r => setTimeout(r, 1500));

    return new Response(JSON.stringify({ campaign }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
