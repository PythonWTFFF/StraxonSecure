import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkFeatureUsage, logFeatureUsage } from "@/server/usage";
import { logAudit } from "@/server/security/audit";
import { createRateLimiter } from "@/server/security/rateLimit";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface AskAIInput {
  messages: ChatMessage[];
  mode?: "explain" | "architect" | "chat" | "responder" | "compliance" | "reverse";
}

const SYSTEM_PROMPTS: Record<string, string> = {
  explain:
    "You are a senior cybersecurity instructor. Explain attacks, vulnerabilities, and defenses clearly with concrete examples and remediation steps. Use markdown. Keep responses focused and under 400 words unless asked for detail.",
  architect:
    "You are a security architect. Review network architecture diagrams (nodes & edges) and suggest concrete improvements: missing firewalls, encryption gaps, single points of failure, missing rate limiting, etc. Output a numbered list of actionable suggestions in markdown.",
  chat: "You are Straxon, an elite cybersecurity AI assistant. Help users understand attacks, harden systems, and learn defensive practices. Be concise, technical, and use markdown formatting.",
  responder:
    "You are an expert Incident Responder. Review logs, telemetry, and alerts to identify Indicators of Compromise (IoCs), determine root causes, and suggest immediate containment, eradication, and recovery strategies. Be precise, actionable, and use markdown formatting.",
  compliance:
    "You are a Compliance & Governance Auditor (SOC2, ISO27001). Review systems, processes, and architectures to identify compliance gaps. Provide specific control frameworks, audit procedures, and remediation steps. Output clear, authoritative guidance in markdown.",
  reverse:
    "You are a Malware Reverse Engineer. Analyze decompiled code, hex dumps, and behavioral reports. Explain the malware's capabilities, persistence mechanisms, and evasion techniques. Use technical language and format output in markdown.",
};

export const askAI = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth, createRateLimiter(15, 60, "rate_limit:ask_ai")])
  .validator((input: AskAIInput) => {
    if (!input || !Array.isArray(input.messages)) {
      throw new Error("Invalid input: messages required");
    }
    if (input.messages.length > 40) {
      throw new Error("Too many messages");
    }
    for (const m of input.messages) {
      if (!m || typeof m.content !== "string" || m.content.length > 8000) {
        throw new Error("Invalid message");
      }
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const mode = data.mode ?? "chat";
    const systemPrompt = SYSTEM_PROMPTS[mode];

    await checkFeatureUsage((context as any).userId as string, "ai_prompt");

    let replyText = "";
    try {
      const mlUrl = process.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${mlUrl}/api/ml/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        replyText = json.reply || "";
      } else {
        throw new Error(`ML Engine error: ${res.statusText}`);
      }
    } catch (e: any) {
      console.warn("ML Engine unreachable, attempting Gemini API fallback:", e.message);
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          const contents = data.messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
              }),
            },
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            replyText =
              gData.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
          } else {
            console.error("Gemini API error:", await geminiRes.text());
            replyText = "AI defense engine is currently re-calibrating. Please retry in a moment.";
          }
        } catch (geminiErr: any) {
          console.error("Gemini direct fallback error:", geminiErr);
          replyText = "AI defense engine is currently re-calibrating. Please retry in a moment.";
        }
      } else {
        replyText = "AI defense engine is currently unavailable. Please verify API configurations.";
      }
    }

    if (!replyText) {
      replyText = "No response generated.";
    }

    await logFeatureUsage(
      (context as any).userId as string,
      "ai_prompt",
      { mode },
      (context as any).requestId as string,
    );

    // Phase 5: Immutable Audit Logging
    await logAudit({
      requestId: ((context as any).requestId as string) ?? "unknown",
      actorUserId: (context as any).userId as string,
      orgId: "00000000-0000-0000-0000-000000000000",
      action: "ai.ask",
      serverFn: "askAI",
      metadata: { mode, messageCount: data.messages.length },
    });

    return { reply: replyText };
  });
