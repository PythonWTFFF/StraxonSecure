import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function checkAndAwardAchievements(userId: string, actionType: string) {
  try {
    // 1. Fetch all available achievements for this action type
    const { data: achievements } = await supabaseAdmin
      .from("achievements")
      .select("*")
      .eq("action_type", actionType);

    if (!achievements || achievements.length === 0) return;

    // 2. Fetch user's current achievements to avoid duplicates
    const { data: userAchievements } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const earnedIds = new Set(userAchievements?.map(a => a.achievement_id) || []);

    // 3. Evaluate criteria (simplified for this audit: award directly based on action)
    for (const achievement of achievements) {
      if (!earnedIds.has(achievement.id)) {
        // Award the achievement
        await supabaseAdmin.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        });
      }
    }
  } catch (err) {
    console.error("[Achievements Error]", err);
  }
}
