import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getPacketScans = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (supabaseAdmin as any)
      .from("packet_scans")
      .select("*")
      .eq("user_id", (context as any).userId as string)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to load packet scans");
    return data;
  });

export const analyzePacket = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ filename: z.string(), size: z.number(), results: z.any() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: scan, error } = await (supabaseAdmin as any)
      .from("packet_scans")
      .insert({
        user_id: (context as any).userId as string,
        filename: data.filename,
        size_bytes: data.size,
        analysis_results: data.results,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to save analysis");
    return scan;
  });
