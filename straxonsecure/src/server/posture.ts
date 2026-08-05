import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { askAI } from "@/server/ai";

// ─── Security Posture Score ───────────────────────────────────────────────────

export const getSecurityPosture = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [postureRes, labsRes, ctfRes, complianceRes, socRes, archRes] = await Promise.all([
      supabaseAdmin
        .from("security_posture")
        .select("*")
        .eq("user_id", context.userId)
        .maybeSingle(),
      supabaseAdmin
        .from("lesson_progress")
        .select("lesson_slug")
        .eq("user_id", context.userId)
        .eq("completed", true)
        .like("lesson_slug", "lab-%"),
      supabaseAdmin.from("ctf_solves").select("points_earned").eq("user_id", context.userId),
      supabaseAdmin
        .from("compliance_runs")
        .select("score, framework")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("soc_events").select("id").eq("user_id", context.userId).limit(100),
      supabaseAdmin.from("architectures").select("id").eq("user_id", context.userId).limit(10),
    ]);

    const posture = postureRes.data;
    const labsCompleted = labsRes.data?.length ?? 0;
    const ctfPoints = (ctfRes.data ?? []).reduce((s, r) => s + (r.points_earned ?? 0), 0);
    const complianceScore = complianceRes.data?.reduce((s, r) => s + r.score, 0) ?? 0;
    const socEvents = socRes.data?.length ?? 0;
    const archCount = archRes.data?.length ?? 0;

    // Compute scores
    const labs_score = Math.min(labsCompleted * 50, 300);
    const ctf_score = Math.min(ctfPoints, 300);
    const compliance_score = Math.min(complianceScore, 200);
    const soc_score = Math.min(socEvents * 2, 200);
    const architecture_score = Math.min(archCount * 25, 200);
    const threat_intel_score = posture?.threat_intel_score ?? 0;
    const total_score = Math.min(
      labs_score +
        ctf_score +
        compliance_score +
        soc_score +
        architecture_score +
        threat_intel_score,
      1000,
    );

    // Update posture
    await supabaseAdmin.from("security_posture").upsert(
      {
        user_id: context.userId,
        total_score,
        labs_score,
        ctf_score,
        compliance_score,
        soc_score,
        architecture_score,
        threat_intel_score,
        xp: total_score,
        level: Math.floor(total_score / 100) + 1,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return {
      total_score,
      labs_score,
      ctf_score,
      compliance_score,
      soc_score,
      architecture_score,
      threat_intel_score,
      level: Math.floor(total_score / 100) + 1,
      xp: total_score,
      next_level_xp: (Math.floor(total_score / 100) + 1) * 100,
      badges: posture?.badges ?? [],
      streak_days: posture?.streak_days ?? 0,
      breakdown: {
        labs: { score: labs_score, max: 300, label: "Attack Labs", count: labsCompleted },
        ctf: { score: ctf_score, max: 300, label: "CTF Challenges", points: ctfPoints },
        compliance: {
          score: compliance_score,
          max: 200,
          label: "Compliance",
          runs: complianceRes.data?.length ?? 0,
        },
        soc: { score: soc_score, max: 200, label: "SOC Operations", events: socEvents },
        architecture: {
          score: architecture_score,
          max: 200,
          label: "Architecture",
          designs: archCount,
        },
        threat_intel: { score: threat_intel_score, max: 200, label: "Threat Intel" },
      },
    };
  });

// ─── Get Global Leaderboard ───────────────────────────────────────────────────

export const getGlobalLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: postures } = await supabaseAdmin
      .from("security_posture")
      .select("user_id, total_score, level, xp, badges, streak_days")
      .order("total_score", { ascending: false })
      .limit(50);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url");

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return {
      leaderboard: (postures ?? []).map((p, i) => ({
        rank: i + 1,
        userId: p.user_id,
        displayName: profileMap.get(p.user_id)?.display_name ?? `User ${p.user_id.slice(0, 6)}`,
        avatar: profileMap.get(p.user_id)?.avatar_url,
        totalScore: p.total_score,
        level: p.level,
        badges: p.badges,
        streakDays: p.streak_days,
        isCurrentUser: p.user_id === context.userId,
      })),
    };
  });

// ─── AI Threat Hunter ────────────────────────────────────────────────────────

export const aiThreatHunt = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        mode: z.enum(["analyst", "redteam", "blueteam"]),
        context: z.string().max(4000),
        query: z.string().max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const systemPrompts: Record<string, string> = {
      analyst: `You are STRAX-1, an elite threat intelligence analyst. You analyze security events, identify attack patterns, map them to MITRE ATT&CK, and provide clear remediation guidance. Always structure your response with: THREAT ASSESSMENT, ATTACK CHAIN, IOCs, REMEDIATION STEPS. Use markdown. Be technical and precise.`,
      redteam: `You are STRAX-2, a professional red team operator. You generate realistic attack scenarios, TTPs (Tactics, Techniques, Procedures), and penetration test methodologies for EDUCATIONAL purposes in a controlled lab environment. Map everything to MITRE ATT&CK. Provide: ATTACK VECTOR, EXECUTION STEPS, EXPECTED ARTIFACTS, DETECTION OPPORTUNITIES. Use markdown.`,
      blueteam: `You are STRAX-3, a defensive security expert and SOC lead. You provide hardening guides, detection rules (Sigma/Yara), incident response playbooks, and security architecture recommendations. Structure: DETECTION RULE, HARDENING STEPS, MONITORING ALERTS, ARCHITECTURE FIX. Use markdown.`,
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompts[data.mode] },
            { role: "user", content: `Context:\n${data.context}\n\nQuery: ${data.query}` },
          ],
        }),
      },
    );

    if (!res.ok) throw new Error("AI request failed");
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });

// ─── War Room ────────────────────────────────────────────────────────────────

export const createWarRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        name: z.string().max(100),
        durationMinutes: z.number().int().min(5).max(120).default(30),
        scenario: z.enum(["breach", "ddos", "ransomware", "apt", "custom"]).default("breach"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: session, error } = await supabaseAdmin
      .from("warroom_sessions")
      .insert({
        name: data.name,
        creator_id: context.userId,
        duration_minutes: data.durationMinutes,
        config: { scenario: data.scenario },
        status: "waiting",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Creator joins as red team by default
    await supabaseAdmin.from("warroom_participants").insert({
      session_id: session.id,
      user_id: context.userId,
      team: "red",
    });

    return { sessionId: session.id };
  });

export const joinWarRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({ sessionId: z.string().uuid(), team: z.enum(["red", "blue", "spectator"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await supabaseAdmin.from("warroom_participants").upsert(
      {
        session_id: data.sessionId,
        user_id: context.userId,
        team: data.team,
      },
      { onConflict: "session_id,user_id" },
    );

    return { ok: true };
  });

export const getWarRoomSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("warroom_sessions")
      .select("*, warroom_participants(user_id, team)")
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(20);

    return { sessions: data ?? [] };
  });
