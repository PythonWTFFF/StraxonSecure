import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";

export const Route = createFileRoute("/api/public/edr/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response("Missing or invalid Authorization header", { status: 401 });
          }

          const rawKey = authHeader.replace("Bearer ", "").trim();
          const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

          // Authenticate user via API key
          const { data: apiKey, error: authError } = await (supabaseAdmin as any)
            .from("api_keys")
            .select("user_id")
            .eq("key_hash", keyHash)
            .single();

          if (authError || !apiKey) {
            return new Response("Unauthorized API Key", { status: 401 });
          }

          const userId = apiKey.user_id;
          const body = await request.json();

          const { endpointId, hostname, os = "Windows", processes = [] } = body;

          if (!endpointId) {
            return new Response("Missing endpointId", { status: 400 });
          }

          // 1. Upsert the Endpoint to mark it online and active
          await (supabaseAdmin as any)
            .from("edr_endpoints")
            .upsert({
              id: endpointId,
              user_id: userId,
              hostname: hostname || "Unknown Host",
              ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
              os_info: os,
              status: "online",
              last_seen: new Date().toISOString(),
            }, { onConflict: "id" });

          // 2. Insert process telemetry
          // Note: The agent is responsible for only sending NEW processes to avoid DB bloat.
          if (processes.length > 0) {
            const processRecords = processes.map((p: any) => ({
              user_id: userId,
              endpoint_id: endpointId,
              process_name: p.processName,
              command_line: p.commandLine,
              parent_process: p.parentProcess,
              run_as_user: p.user,
              sha256_hash: p.hash,
              threat_level: "low", // Default to low, operator can click "Analyze" in UI
              action_taken: "monitored",
            }));

            // Insert in batches if there are many, though we assume agent sends small batches
            const { error: insertError } = await (supabaseAdmin as any)
              .from("edr_process_events")
              .insert(processRecords);

            if (insertError) {
              console.error("Failed to insert telemetry:", insertError);
              return new Response("Error storing telemetry", { status: 500 });
            }
          }

          return new Response(JSON.stringify({ success: true, ingested: processes.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("Ingest API Error:", e);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    },
  },
});
