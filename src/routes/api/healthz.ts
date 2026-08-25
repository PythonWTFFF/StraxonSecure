// @ts-ignore
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const APIRoute = createAPIFileRoute("/api/healthz")({
  GET: async () => {
    try {
      // Check database connectivity
      const { data, error } = await supabaseAdmin.from("teams").select("id").limit(1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ status: "ok", db: "connected", timestamp: Date.now() }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ status: "error", error: err.message, timestamp: Date.now() }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
