import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getChallenges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Fetch all challenges
    const { data: challenges, error } = await (supabaseAdmin as any)
      .from("ctf_challenges")
      .select("id, title, description, points, category");

    if (error) throw new Error("Failed to load challenges");

    // Fetch solved challenges for the user
    const { data: solved } = await (supabaseAdmin as any)
      .from("ctf_submissions")
      .select("challenge_id")
      .eq("user_id", context.userId);

    const solvedIds = new Set(solved?.map((s: any) => s.challenge_id) || []);

    // Merge status
    return challenges.map((c: any) => ({
      ...c,
      isSolved: solvedIds.has(c.id)
    }));
  });

export const submitFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
      .from("ctf_submissions")
      .insert({ user_id: context.userId, challenge_id: data.challengeId });

    if (error) {
      if (error.code === '23505') throw new Error("You already solved this challenge!");
      throw new Error("Database error");
    }

    // Award points to leaderboard
    await (supabaseAdmin as any)
      .rpc('increment_score', { user_id: context.userId, points_to_add: challenge.points });

    return { success: true, pointsAwarded: challenge.points };
  });
