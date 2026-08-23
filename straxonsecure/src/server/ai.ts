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

    try {
      const mlUrl = process.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${mlUrl}/api/ml/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Engine failed: ${await res.text()}`);
      }

      const json = await res.json();
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
        orgId: "00000000-0000-0000-0000-000000000000", // Needs true orgId when multi-tenant is active
        action: "ai.ask",
        serverFn: "askAI",
        metadata: { mode, messageCount: data.messages.length },
      });

      return { reply: json.reply || "No response generated." };
    } catch (e: any) {
      console.error("AI Request Failed", e);
      throw new Error(e.message || "AI request failed");
    }
  });
