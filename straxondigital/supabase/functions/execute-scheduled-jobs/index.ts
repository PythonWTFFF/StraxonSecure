import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "straxon_scheduled_cron_secret";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller: either secret header, Authorization JWT, or query param
    const authHeader = req.headers.get("Authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    let targetWorkspaceId: string | undefined;

    let authorized = false;
    if (cronSecretHeader && cronSecretHeader === CRON_SECRET) {
      authorized = true;
    } else if (authHeader) {
      // Authenticated user invoking for their workspace
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        authorized = true;
        // Optionally get workspaceId from request body
        try {
          const body = await req.json();
          targetWorkspaceId = body?.workspaceId;
        } catch { /* ignore empty body */ }
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized cron execution" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();

    // Query due schedules
    let query = admin
      .from("automation_schedules")
      .select("*")
      .eq("enabled", true);

    if (targetWorkspaceId) {
      query = query.eq("workspace_id", targetWorkspaceId);
    } else {
      // In automated cron mode, only execute schedules where next_run_at <= now OR last_run_at IS NULL
      query = query.or(`next_run_at.lte.${now.toISOString()},last_run_at.is.null`);
    }

    const { data: schedules, error: schedErr } = await query;
    if (schedErr) throw schedErr;

    console.log(`[execute-scheduled-jobs] Found ${schedules?.length || 0} due schedules`);

    const results: Array<{ schedule_id: string; job_name: string; status: string; run_id?: string; error?: string }> = [];

    for (const sched of (schedules || [])) {
      try {
        console.log(`[execute-scheduled-jobs] Executing schedule ${sched.id} (${sched.job_name})`);

        // Invoke run-automation function internally
        const runInput = sched.input_payload?.input || `Automated recurring execution for ${sched.job_name}`;
        const runRes = await fetch(`${SUPABASE_URL}/functions/v1/run-automation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            jobId: sched.job_id,
            workspaceId: sched.workspace_id,
            input: runInput,
            triggerType: "scheduled",
          }),
        });

        const runData = await runRes.json();
        if (!runRes.ok || runData.error) {
          throw new Error(runData.error || `Run failed with status ${runRes.status}`);
        }

        // Calculate next run date
        let nextRun = new Date();
        if (sched.frequency === "daily") {
          nextRun.setDate(nextRun.getDate() + 1);
        } else if (sched.frequency === "weekly") {
          nextRun.setDate(nextRun.getDate() + 7);
        } else if (sched.frequency === "monthly") {
          nextRun.setMonth(nextRun.getMonth() + 1);
        } else {
          nextRun.setDate(nextRun.getDate() + 7);
        }

        // Update schedule record
        await admin
          .from("automation_schedules")
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
            run_count: (sched.run_count || 0) + 1,
            updated_at: now.toISOString(),
          })
          .eq("id", sched.id);

        results.push({
          schedule_id: sched.id,
          job_name: sched.job_name,
          status: "completed",
          run_id: runData.run_id,
        });

      } catch (jobErr: any) {
        console.error(`[execute-scheduled-jobs] Error executing schedule ${sched.id}:`, jobErr);
        results.push({
          schedule_id: sched.id,
          job_name: sched.job_name,
          status: "failed",
          error: jobErr.message,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.status === "completed").length,
      timestamp: now.toISOString(),
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[execute-scheduled-jobs] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to execute scheduled jobs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
