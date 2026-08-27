import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateCopilotResponse = createServerFn("POST", async (data: { message: string, context?: string }, ctx) => {
  await requireSupabaseAuth(ctx);
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const systemPrompt = `You are Straxon Copilot, an elite AI cybersecurity assistant built into the Straxon Secure platform.
You are speaking to a cybersecurity operator or analyst. Be concise, highly technical, and use cyber terminology.
Do not use markdown formatting like **bold** excessively unless needed for readability. Keep responses under 4 sentences if possible.
Context provided by the platform: ${data.context || "None"}`;

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.message }
          ],
          temperature: 0.2,
          max_tokens: 300
        }),
      }
    );

    if (!res.ok) {
      console.error("[Copilot] API Error:", await res.text());
      throw new Error("Failed to generate response");
    }

    const payload = await res.json();
    return {
      message: payload.choices[0].message.content,
    };
  } catch (error: any) {
    console.error("[Copilot Error]", error);
    throw new Error("AI engine unavailable.");
  }
});
