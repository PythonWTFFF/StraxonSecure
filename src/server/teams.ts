import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { requireTeamAccess } from "@/server/security/authorization";

export const getTeamMembers = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth, requireTeamAccess])
  .validator((d) => z.object({ teamId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Fetch all members with their profile display name
    const { data: members, error } = await (supabaseAdmin as any)
      .from("team_members")
      .select(
        `
        id,
        user_id,
        role,
        joined_at,
        profiles ( display_name )
      `,
      )
      .eq("team_id", data.teamId);

    if (error) throw new Error(error.message);
    return members;
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth, requireTeamAccess])
  .validator((d) =>
    z
      .object({
        teamId: z.string().uuid(),
        targetUserId: z.string().uuid(),
        newRole: z.enum(["admin", "analyst", "viewer", "member"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (
      ((context as any).teamRole as string) !== "admin" &&
      ((context as any).teamRole as string) !== "owner"
    ) {
      throw new Error("Unauthorized: Requires Admin privileges");
    }

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
  .middleware([requireRequestId, requireSupabaseAuth, requireTeamAccess])
  .validator((d) =>
    z
      .object({
        teamId: z.string().uuid(),
        targetUserId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (
      ((context as any).teamRole as string) !== "admin" &&
      ((context as any).teamRole as string) !== "owner"
    ) {
      throw new Error("Unauthorized: Requires Admin privileges");
    }

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

export const createTeam = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ name: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: team, error } = await (supabaseAdmin as any)
      .from("teams")
      .insert({
        name: data.name,
        owner_id: (context as any).userId as string,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { error: memberError } = await (supabaseAdmin as any)
      .from("team_members")
      .insert({ team_id: team.id, user_id: (context as any).userId as string, role: "owner" });

    if (memberError) throw new Error(memberError.message);

    return team;
  });

export const joinTeam = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ code: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: team, error } = await (supabaseAdmin as any)
      .from("teams")
      .select("id")
      .eq("invite_code", data.code)
      .single();

    if (error || !team) throw new Error("Invalid invite code");

    const { error: memberError } = await (supabaseAdmin as any)
      .from("team_members")
      .insert({ team_id: team.id, user_id: (context as any).userId as string, role: "member" });

    if (memberError) {
      if (memberError.code === "23505") throw new Error("You are already in this team");
      throw new Error(memberError.message);
    }

    return { success: true, teamId: team.id };
  });

export const getUserTeams = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("team_members")
      .select("team_id, role, teams(id, name, invite_code, owner_id)")
      .eq("user_id", (context as any).userId as string);

    if (error) throw new Error(error.message);

    return data.map((d: any) => ({
      role: d.role,
      ...d.teams,
    }));
  });
