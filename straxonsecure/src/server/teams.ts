import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// Helper to check if user is Owner or Admin
async function requireAdminPrivileges(userId: string, teamId: string) {
  const { data: member } = await (supabaseAdmin as any)
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new Error("Unauthorized: Requires Admin privileges");
  }
}

export const getTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Make sure caller is in the team
    const { data: membership } = await (supabaseAdmin as any)
      .from("team_members")
      .select("role")
      .eq("team_id", data.teamId)
      .eq("user_id", context.userId)
      .single();

    if (!membership) throw new Error("Unauthorized");

    // Fetch all members with their profile display name
    const { data: members, error } = await (supabaseAdmin as any)
      .from("team_members")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles ( display_name )
      `)
      .eq("team_id", data.teamId);

    if (error) throw new Error(error.message);
    return members;
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => 
    z.object({ 
      teamId: z.string().uuid(),
      targetUserId: z.string().uuid(),
      newRole: z.enum(["admin", "analyst", "viewer", "member"])
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await requireAdminPrivileges(context.userId, data.teamId);

    // Prevent demoting the actual team owner
    const { data: team } = await (supabaseAdmin as any)
      .from("teams")
      .select("owner_id")
      .eq("id", data.teamId)
      .single();

    if (team?.owner_id === data.targetUserId) {
      throw new Error("Cannot change the role of the team owner");
    }

    const { error } = await (supabaseAdmin as any)
      .from("team_members")
      .update({ role: data.newRole })
      .eq("team_id", data.teamId)
      .eq("user_id", data.targetUserId);

    if (error) throw new Error("Failed to update role");
    return { success: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => 
    z.object({ 
      teamId: z.string().uuid(),
      targetUserId: z.string().uuid()
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await requireAdminPrivileges(context.userId, data.teamId);

    const { data: team } = await (supabaseAdmin as any)
      .from("teams")
      .select("owner_id")
      .eq("id", data.teamId)
      .single();

    if (team?.owner_id === data.targetUserId) {
      throw new Error("Cannot remove the team owner");
    }

    const { error } = await (supabaseAdmin as any)
      .from("team_members")
      .delete()
      .eq("team_id", data.teamId)
      .eq("user_id", data.targetUserId);

    if (error) throw new Error("Failed to remove member");
    return { success: true };
  });
