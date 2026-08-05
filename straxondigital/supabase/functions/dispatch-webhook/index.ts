import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const { order_id, integration_id } = await req.json();
    if (!order_id || !integration_id) return new Response(JSON.stringify({ error: "order_id+integration_id required" }), { status: 400, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: order } = await admin.from("orders").select("*").eq("id", order_id).single();
    if (!order) return new Response(JSON.stringify({ error: "order not found" }), { status: 404, headers: corsHeaders });

    const { data: member } = await admin.from("workspace_users")
      .select("id").eq("workspace_id", order.workspace_id).eq("user_id", u.user.id).maybeSingle();
    if (!member) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });

    const { data: integ } = await admin.from("workspace_integrations")
      .select("*").eq("id", integration_id).eq("workspace_id", order.workspace_id).maybeSingle();
    if (!integ || !integ.enabled) return new Response(JSON.stringify({ error: "integration not found" }), { status: 404, headers: corsHeaders });

    const payload = {
      source: "straxon-labs",
      order_id: order.id,
      service_type: order.service_type,
      service_name: order.service_name,
      generated_content: order.generated_content,
      dispatched_at: new Date().toISOString(),
    };

    const r = await fetch(integ.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ ok: r.ok, status: r.status }), {
      status: r.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
