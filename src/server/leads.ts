import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const captureLead = createServerFn({ method: "POST" })
  .validator((d) => z.object({ email: z.string().email(), source: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    // Insert into DB. Ignore error if already exists (silent deduplication)
    await supabaseAdmin.from("leads").insert({
      email: data.email,
      source: data.source || "landing_page",
    });
    return { success: true };
  });
