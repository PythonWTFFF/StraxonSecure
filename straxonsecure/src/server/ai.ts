import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface AskAIInput {
  messages: ChatMessage[];
  mode?: "explain" | "architect" | "chat";
}

const SYSTEM_PROMPTS: Record<string, string> = {
  explain:
    "You are a senior cybersecurity instructor. Explain attacks, vulnerabilities, and defenses clearly with concrete examples and remediation steps. Use markdown. Keep responses focused and under 400 words unless asked for detail.",
  architect:
    "You are a security architect. Review network architecture diagrams (nodes & edges) and suggest concrete improvements: missing firewalls, encryption gaps, single points of failure, missing rate limiting, etc. Output a numbered list of actionable suggestions in markdown.",
  chat: "You are Straxon, an elite cybersecurity AI assistant. Help users understand attacks, harden systems, and learn defensive practices. Be concise, technical, and use markdown formatting.",
};

export const askAI = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
    // 1. Point to your new environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI not configured. GEMINI_API_KEY missing.");
    }

    const mode = data.mode ?? "chat";
    const systemPrompt = SYSTEM_PROMPTS[mode];

    // 2. Hit the official Gemini OpenAI-compatibility endpoint
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 3. Define the actual Gemini model you want to use
          model: "gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        }),
      },
    );

    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Try again in a moment.");
    }

    if (!res.ok) {
      const t = await res.text();
      console.error("Gemini API error", res.status, t);
      throw new Error("AI request failed");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const reply = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
