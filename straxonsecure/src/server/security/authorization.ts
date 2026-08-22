import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Middleware to enforce team-based authorization.
 * Ensures the authenticated user belongs to the specified team.
 * This should be layered after requireSupabaseAuth.
 */
export const requireTeamAccess = createMiddleware().server(async (opts) => {
  const data = (opts as any).data;
  const next = opts.next;
  const context = opts.context;

  // Assert data has teamId at runtime
  if (!data || typeof data.teamId !== "string") {
    throw new Error("teamId is required for this action");
  }
  const teamId = data.teamId;

  // Dynamically import server-only code to prevent it from leaking into the client bundle
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check if user is a member of the requested team
  const { data: membership, error } = await (supabaseAdmin as any)
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", (context as any).userId)
    .single();

  if (error || !membership) {
    throw new Error(`Unauthorized: User does not have access to team ${teamId}`);
  }

  return next({
    context: {
      ...(context as any),
      teamId: teamId,
      teamRole: membership.role,
    },
  });
});
