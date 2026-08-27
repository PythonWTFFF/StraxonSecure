import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
﻿import { createMiddleware } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Middleware that restricts a server function to users with profiles.role = "admin".
 *
 * Must be placed AFTER requireSupabaseAuth in the middleware chain so that
 * context.userId is already populated when this middleware runs.
 *
 * Usage:
 *   .middleware([traceRequest, requireRequestId, requireSupabaseAuth, requireAdmin])
 */
export const requireAdmin = createMiddleware().server(async ({ next, context }) => {
  const userId = (context as unknown as ServerContext).userId as string;

  if (!userId) {
    throw new Response("Unauthorized: Authentication required", { status: 401 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Response("Forbidden: Profile not found", { status: 403 });
  }

  if ((profile as any).role !== "admin") {
    throw new Response("Forbidden: Admin access required", { status: 403 });
  }

  return next({ context: { ...(context as unknown as ServerContext), isAdmin: true } });
});
