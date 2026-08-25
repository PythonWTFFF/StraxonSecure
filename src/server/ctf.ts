import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getChallenges = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Fetch all challenges
    const { data: challenges, error } = await (supabaseAdmin as any)
      .from("ctf_challenges")
      .select("id, title, description, points, category");

    if (error) throw new Error("Failed to load challenges");

    // Fetch solved challenges for the user
    const { data: solved } = await (supabaseAdmin as any)
      .from("ctf_solves")
      .select("challenge_id")
      .eq("user_id", (context as any).userId as string);

    const solvedIds = new Set(solved?.map((s: any) => s.challenge_id) || []);

    // Merge status
    return challenges.map((c: any) => ({
      ...c,
      isSolved: solvedIds.has(c.id),
    }));
  });

export const submitFlag = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ challengeId: z.string().uuid(), flag: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    // Verify flag
    const { data: challenge } = await (supabaseAdmin as any)
      .from("ctf_challenges")
      .select("flag_hash, points")
      .eq("id", data.challengeId)
      .single();

    if (!challenge) throw new Error("Challenge not found");

    if (challenge.flag_hash !== data.flag) {
      throw new Error("Invalid flag");
    }

    // Insert submission
    const { error } = await (supabaseAdmin as any)
      .from("ctf_solves")
      .insert({ user_id: (context as any).userId as string, challenge_id: data.challengeId });

    if (error) {
      if (error.code === "23505") throw new Error("You already solved this challenge!");
      throw new Error("Database error");
    }

    // Award points to leaderboard
    const { data: profile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("ctf_score")
      .eq("id", (context as any).userId as string)
      .single();

    if (profile) {
      await (supabaseAdmin as any)
        .from("profiles")
        .update({ ctf_score: (profile.ctf_score || 0) + challenge.points })
        .eq("id", (context as any).userId as string);
    }

    return { success: true, pointsAwarded: challenge.points };
  });

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (supabaseAdmin as any)
    .from("profiles")
    .select("id, display_name, ctf_score, level")
    .order("ctf_score", { ascending: false })
    .limit(50);

  if (error) throw new Error("Failed to load leaderboard");

  const leaderboard = data.map((u: any, index: number) => ({
    rank: index + 1,
    userId: u.id,
    displayName: u.display_name || "Anonymous",
    totalScore: u.ctf_score || 0,
    level: u.level || 1,
    isCurrentUser: false,
  }));

  return { leaderboard };
});
