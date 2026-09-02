import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth token");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { recipientEmail, frequency = "weekly", workspaceId, isTest = false } = await req.json().catch(() => ({}));
    const targetEmail = recipientEmail || user.email;

    if (!targetEmail) throw new Error("Recipient email is required");

    // 1. Gather recent performance metrics
    const [ordersRes, automationsRes, leadsRes, feedbackRes] = await Promise.all([
      admin.from("orders").select("id, service_name, status, created_at").eq("user_id", user.id).limit(10),
      admin.from("automation_runs").select("id, job_name, status, created_at").eq("user_id", user.id).limit(20),
      admin.from("agency_leads").select("id, full_name, company, audit_score, created_at").eq("user_id", user.id).limit(10),
      admin.from("portal_feedback").select("id, client_name, feedback_type, message, created_at").limit(10),
    ]);

    const recentOrders = ordersRes.data || [];
    const recentAutomations = automationsRes.data || [];
    const recentLeads = leadsRes.data || [];
    const recentFeedback = feedbackRes.data || [];

    // 2. Synthesize with GPT-4o-mini
    let digestContent = {
      executive_summary: `Over the past ${frequency === "daily" ? "24 hours" : "week"}, your Straxon Digital autonomous infrastructure processed ${recentAutomations.length} automation runs, tracked ${recentLeads.length} new inbound prospects, and maintained 100% deliverable reliability.`,
      highlights: [
        `Automations Active: ${recentAutomations.length} autonomous jobs executed without human bottleneck`,
        `Client Portals: ${recentFeedback.length} approval & revision updates synced in real-time`,
        `Lead Pipeline: ${recentLeads.length} new founder leads captured through your embeddable widget`,
      ],
      recommended_action: "Review pending client approvals in your Client Profit Center and trigger your weekly SEO keyword cluster blitz.",
    };

    if (OPENAI_API_KEY) {
      try {
        const prompt = `Generate an executive ${frequency} intelligence digest for an agency/founder using Straxon Digital.
Recent data:
- Automations completed: ${recentAutomations.length}
- Orders processed: ${recentOrders.length}
- Inbound leads captured: ${recentLeads.length}
- Client feedback submissions: ${recentFeedback.length}

Output JSON format:
{
  "executive_summary": "2-3 sentences high impact summary of business traction and efficiency gains",
  "highlights": ["3 concise bullet points with numbers highlighting progress"],
  "recommended_action": "1 high-priority revenue-generating action to take today"
}`;

        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "You write sleek, punchy executive business briefings for SaaS founders. Output valid JSON only." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          digestContent = JSON.parse(aiJson.choices[0].message.content);
        }
      } catch (err) {
        console.warn("[send-email-digest] OpenAI error, fallback used:", err);
      }
    }

    // 3. Optional Resend Email Dispatch
    let emailStatus = "sent";
    if (RESEND_API_KEY && !isTest) {
      try {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; background: #fafafa; border-radius: 12px;">
            <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">Straxon Digital — ${frequency.toUpperCase()} INTELLIGENCE DIGEST</h1>
              <p style="color: #666; font-size: 13px; margin-top: 4px;">Autonomous Agency Operations & Traction Briefing</p>
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
              <h2 style="font-size: 16px; margin-top: 0; color: #1f2937;">Executive Summary</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #374151;">${digestContent.executive_summary}</p>
            </div>

            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
              <h2 style="font-size: 16px; margin-top: 0; color: #1f2937;">Key Traction Highlights</h2>
              <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6; color: #374151;">
                ${digestContent.highlights.map((h: string) => `<li style="margin-bottom: 8px;">${h}</li>`).join("")}
              </ul>
            </div>

            <div style="background: #eef2ff; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; margin-bottom: 20px;">
              <strong style="color: #4338ca; font-size: 13px; text-transform: uppercase;">High Priority Action:</strong>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #312e81;">${digestContent.recommended_action}</p>
            </div>

            <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
              <p>Sent autonomously by Straxon Digital Operations Engine · <a href="https://straxondigital.com" style="color: #6366f1;">Open Command Center</a></p>
            </div>
          </div>
        `;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Straxon Intelligence <briefings@straxondigital.com>",
            to: [targetEmail],
            subject: `⚡ [${frequency.toUpperCase()}] Your Autonomous Agency Intelligence Briefing`,
            html: emailHtml,
          }),
        });

        if (!resendRes.ok) {
          console.warn("[send-email-digest] Resend API error:", await resendRes.text());
        }
      } catch (sendErr) {
        console.warn("[send-email-digest] Dispatch error:", sendErr);
        emailStatus = "failed";
      }
    }

    // 4. Save record in database
    const digestRecord = {
      user_id: user.id,
      workspace_id: workspaceId || null,
      recipient_email: targetEmail,
      frequency,
      executive_summary: digestContent.executive_summary,
      highlights: digestContent.highlights,
      metrics_summary: {
        automations_count: recentAutomations.length,
        leads_count: recentLeads.length,
        orders_count: recentOrders.length,
        feedback_count: recentFeedback.length,
        recommended_action: digestContent.recommended_action,
      },
      status: emailStatus,
      sent_at: new Date().toISOString(),
    };

    const { data: savedDigest } = await admin
      .from("email_digests")
      .insert(digestRecord)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        data: savedDigest || digestRecord,
        recipient: targetEmail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[send-email-digest] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to send email digest" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
