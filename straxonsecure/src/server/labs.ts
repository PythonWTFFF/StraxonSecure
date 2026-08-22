import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkFeatureUsage, logFeatureUsage } from "./usage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LabId =
  | "sqli"
  | "xss"
  | "brute"
  | "ddos"
  | "misconfig"
  | "rce"
  | "ssrf"
  | "csrf"
  | "jwt"
  | "lfi"
  | "xxe"
  | "idor";

// ─── Flag Definitions (static, server-side) ─────────────────────────────────
const LAB_FLAGS: Record<string, string> = {
  sqli: "straxon{un10n_b4s3d_inj3ct10n_pwn3d}",
  xss: "straxon{sc1pt_1nj3ct3d_x55_h4ck3r}",
  brute: "straxon{p4ssw0rd_cr4ck3d_n0_r4t3_l1m1t}",
  ddos: "straxon{r4t3_l1m1t_byp4ss3d_fl00d}",
  misconfig: "straxon{d3f4ult_cr3ds_4r3_d4ng3r0us}",
  rce: "straxon{r3m0t3_c0d3_3x3cut10n_ach13v3d}",
  ssrf: "straxon{s3rv3r_s1d3_r3qu3st_f0rg3ry}",
  csrf: "straxon{cr0ss_s1t3_r3qu3st_f0rg3d}",
  jwt: "straxon{4lg0r1thm_c0nfus10n_jwt_pwn3d}",
  lfi: "straxon{l0c4l_f1l3_1nclus10n_p4th_tr4v3rs4l}",
  xxe: "straxon{xml_3xt3rn4l_3nt1ty_1nj3ct10n}",
  idor: "straxon{1ns3cur3_d1r3ct_0bj3ct_r3f3r3nc3}",
};

// ─── Point values per lab ───────────────────────────────────────────────────
const LAB_POINTS: Record<string, number> = {
  sqli: 100,
  xss: 100,
  brute: 150,
  ddos: 150,
  misconfig: 200,
  rce: 300,
  ssrf: 250,
  csrf: 200,
  jwt: 350,
  lfi: 200,
  xxe: 300,
  idor: 200,
};

// ─── Start Lab Session ───────────────────────────────────────────────────────
export const startLabSession = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        labId: z.string(),
        mode: z.enum(["learning", "challenge", "ctf"]).default("learning"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Usage Enforcement
    await checkFeatureUsage((context as any).userId as string, "lab_session");
    await logFeatureUsage(
      (context as any).userId as string,
      "lab_session",
      { labId: data.labId, mode: data.mode },
      (context as any).requestId as string,
    );

    // Project Titan: Call Python Docker Orchestrator
    let containerPort = 0;
    try {
      const LAB_IMAGES: Record<string, string> = {
        sqli: "nginxdemos/hello",
        rce: "nginxdemos/hello", // In a real scenario, use actual vulnerable images like bkimminich/juice-shop
        ad_network: "vulnerables/cve-2020-1472", // Simulated ZeroLogon AD
        ransomware: "kasmweb/core-ubuntu-focal", // Isolated container for ransomware execution
      };
      const image = LAB_IMAGES[data.labId] || "nginxdemos/hello";
      containerPort = Math.floor(Math.random() * (9000 - 8100 + 1)) + 8100;

      const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${mlUrl}/api/labs/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, port: containerPort }),
      });
      if (!res.ok) {
        console.error("[Orchestrator] Failed to launch container", await res.text());
        containerPort = 0;
      }
    } catch (e) {
      console.error("[Orchestrator] Service unavailable", e);
      containerPort = 0;
    }

    const { data: session, error } = await supabaseAdmin
      .from("lab_sessions")
      .insert({
        user_id: (context as any).userId as string,
        lab_id: data.labId,
        mode: data.mode,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { sessionId: session.id, containerPort };
  });

// ─── Submit CTF Flag ────────────────────────────────────────────────────────
export const submitLabFlag = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({ labId: z.string(), flag: z.string().max(500), sessionId: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const correct = LAB_FLAGS[data.labId];
    if (!correct) return { correct: false, message: "Unknown lab" };

    const isCorrect = data.flag.trim().toLowerCase() === correct.toLowerCase();

    if (isCorrect) {
      // Mark session complete
      await supabaseAdmin
        .from("lab_sessions")
        .update({
          completed_at: new Date().toISOString(),
          score: LAB_POINTS[data.labId] ?? 100,
          flags_captured: [data.flag],
        })
        .eq("id", data.sessionId)
        .eq("user_id", (context as any).userId as string);

      // Update security posture labs score
      // await supabaseAdmin
      //   .rpc("increment_posture_labs", {
      //     p_user_id: ((context as any).userId as string),
      //     p_points: LAB_POINTS[data.labId] ?? 100,
      //   })
      //   .maybeSingle();

      // Update lesson_progress
      await supabaseAdmin.from("lesson_progress").upsert(
        {
          user_id: (context as any).userId as string,
          lesson_slug: `lab-${data.labId}`,
          completed: true,
        },
        { onConflict: "user_id,lesson_slug" },
      );
    }

    return {
      correct: isCorrect,
      message: isCorrect
        ? `🎉 Correct! +${LAB_POINTS[data.labId] ?? 100} XP`
        : "❌ Incorrect flag. Keep trying!",
      flag: isCorrect ? correct : undefined,
    };
  });

// ─── Get User Lab Progress ───────────────────────────────────────────────────
export const getUserLabProgress = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("lesson_progress")
      .select("lesson_slug, completed")
      .eq("user_id", (context as any).userId as string)
      .like("lesson_slug", "lab-%");

    const completed = new Set(
      (data ?? []).filter((r) => r.completed).map((r) => r.lesson_slug.replace("lab-", "")),
    );
    return { completed: [...completed] };
  });

// ─── CTF: Get Challenges ─────────────────────────────────────────────────────
export const getCTFChallenges = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: challenges }, { data: solves }, { data: hints }] = await Promise.all([
      supabaseAdmin.from("ctf_challenges").select("*").eq("is_active", true).order("points"),
      supabaseAdmin
        .from("ctf_solves")
        .select("challenge_id, solved_at, points_earned, hints_used")
        .eq("user_id", (context as any).userId as string),
      supabaseAdmin
        .from("ctf_hint_usage")
        .select("challenge_id, hint_index")
        .eq("user_id", (context as any).userId as string),
    ]);

    const solvedIds = new Set((solves ?? []).map((s) => s.challenge_id));
    const usedHints: Record<string, number[]> = {};
    for (const h of hints ?? []) {
      if (!usedHints[h.challenge_id]) usedHints[h.challenge_id] = [];
      usedHints[h.challenge_id].push(h.hint_index);
    }

    return {
      challenges: (challenges ?? []).map((c) => ({
        ...c,
        // Hide flag hash from client
        flag_hash: undefined,
        solved: solvedIds.has(c.id),
        usedHints: usedHints[c.id] ?? [],
      })),
      totalSolved: solvedIds.size,
    };
  });

// ─── CTF: Submit Flag ────────────────────────────────────────────────────────
export const submitCTFFlag = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z.object({ challengeId: z.string().uuid(), flag: z.string().max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: challenge } = await supabaseAdmin
      .from("ctf_challenges")
      .select("id, flag_hash, points, solve_count")
      .eq("id", data.challengeId)
      .single();

    if (!challenge) return { correct: false, message: "Challenge not found" };

    // Check already solved
    const { data: existing } = await supabaseAdmin
      .from("ctf_solves")
      .select("id")
      .eq("user_id", (context as any).userId as string)
      .eq("challenge_id", data.challengeId)
      .maybeSingle();

    if (existing) return { correct: true, message: "Already solved!", alreadySolved: true };

    const isCorrect = data.flag.trim().toLowerCase() === challenge.flag_hash.trim().toLowerCase();

    if (isCorrect) {
      const hintsUsed = await supabaseAdmin
        .from("ctf_hint_usage")
        .select("id")
        .eq("user_id", (context as any).userId as string)
        .eq("challenge_id", data.challengeId);

      const hintCount = hintsUsed.data?.length ?? 0;
      const pointsEarned = Math.max(
        Math.floor(challenge.points * (1 - hintCount * 0.1)),
        Math.floor(challenge.points * 0.5),
      );

      await Promise.all([
        supabaseAdmin.from("ctf_solves").insert({
          user_id: (context as any).userId as string,
          challenge_id: data.challengeId,
          hints_used: hintCount,
          points_earned: pointsEarned,
        }),
        supabaseAdmin
          .from("ctf_challenges")
          .update({ solve_count: challenge.solve_count + 1 })
          .eq("id", data.challengeId),
        // supabaseAdmin
        //  .from("security_posture")
        //  .upsert({ user_id: ((context as any).userId as string) }, { onConflict: "user_id" })
        //  .then(() =>
        //    supabaseAdmin
        //      .rpc("increment_posture_ctf", {
        //        p_user_id: ((context as any).userId as string),
        //        p_points: pointsEarned,
        //      })
        //      .maybeSingle(),
        //  ),
      ]);

      return {
        correct: true,
        message: `🚩 Flag captured! +${pointsEarned} points`,
        pointsEarned,
      };
    }

    return { correct: false, message: "❌ Wrong flag. Try again!" };
  });

// ─── CTF: Use Hint ───────────────────────────────────────────────────────────
export const useCTFHint = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({ challengeId: z.string().uuid(), hintIndex: z.number().int().min(0).max(5) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: challenge } = await supabaseAdmin
      .from("ctf_challenges")
      .select("hints, max_hints")
      .eq("id", data.challengeId)
      .single();

    if (!challenge) throw new Error("Challenge not found");
    const hints = challenge.hints as Array<{ index: number; text: string }>;
    const hint = hints.find((h) => h.index === data.hintIndex);
    if (!hint) throw new Error("Hint not found");

    await supabaseAdmin.from("ctf_hint_usage").upsert(
      {
        user_id: (context as any).userId as string,
        challenge_id: data.challengeId,
        hint_index: data.hintIndex,
      },
      { onConflict: "user_id,challenge_id,hint_index" },
    );

    return { hint: hint.text };
  });
