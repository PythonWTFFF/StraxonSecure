import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "auth required" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: corsHeaders });

    const { order_id, feedback } = await req.json();
    if (!order_id || !feedback || typeof feedback !== "string" || feedback.length < 4) {
      return new Response(JSON.stringify({ error: "order_id and feedback required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: order } = await admin.from("orders").select("*").eq("id", order_id).single();
    if (!order) return new Response(JSON.stringify({ error: "order not found" }), { status: 404, headers: corsHeaders });

    // membership check
    const { data: member } = await admin
      .from("workspace_users")
      .select("id")
      .eq("workspace_id", order.workspace_id)
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (!member) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });

    if (!order.generated_content) {
      return new Response(JSON.stringify({ error: "Original deliverable missing — cannot revise." }), { status: 400, headers: corsHeaders });
    }

    // brand brain (graceful fallback)
    let brand: Record<string, unknown> | null = null;
    if (order.workspace_id) {
      const { data: bb } = await admin.from("brand_brain").select("*").eq("workspace_id", order.workspace_id).maybeSingle();
      brand = bb;
    }

    // archive previous output, flip to processing
    const history = Array.isArray(order.revision_history) ? order.revision_history : [];
    history.push({ at: new Date().toISOString(), feedback, content: order.generated_content });

    await admin.from("orders").update({
      status: "processing",
      progress: 10,
      revision_history: history,
      error_message: null,
    }).eq("id", order_id);

    const brandBlock = brand && brand.is_configured ? `\n\nBRAND RULES (must obey):\n${JSON.stringify({
      brand_name: brand.brand_name, mission: brand.mission, audience: brand.audience,
      tone: { professional: brand.tone_professional, playful: brand.tone_playful, bold: brand.tone_bold, warm: brand.tone_warm },
      palette: brand.palette, dos: brand.dos, donts: brand.donts,
    }, null, 2)}` : "";

    const userPrompt = `You previously generated this deliverable JSON:
${JSON.stringify(order.generated_content, null, 2)}

The client requested this revision: "${feedback}"

Update the JSON STRICTLY maintaining the same schema (same "kind" and field shape). Only change what's needed to address the feedback.${brandBlock}

Return ONLY the updated JSON object — no prose, no markdown.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You revise structured JSON deliverables for a senior B2B platform. Preserve schema, address feedback, respect brand rules." },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("revise AI err", aiResp.status, text);
      const human = aiResp.status === 429 ? "Rate limit hit. Try again shortly."
        : aiResp.status === 402 ? "Generation credits exhausted." : `Engine error (${aiResp.status})`;
      await admin.from("orders").update({ status: "needs_revision", error_message: human }).eq("id", order_id);
      return new Response(JSON.stringify({ error: human }), { status: aiResp.status, headers: corsHeaders });
    }

    const j = await aiResp.json();
    const raw = j.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty model response");
    const updated = JSON.parse(raw);

    await admin.from("orders").update({
      generated_content: updated,
      status: "completed",
      progress: 100,
      revisions_count: (order.revisions_count ?? 0) + 1,
      error_message: null,
    }).eq("id", order_id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("revise-deliverable failed:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
