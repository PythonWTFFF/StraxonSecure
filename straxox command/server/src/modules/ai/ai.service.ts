import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface GenerateCompletionParams {
  prompt: string;
  responseFormat?: "text" | "json_object";
  maxRetries?: number;
  timeoutMs?: number;
}

export const generateCompletion = async ({
  prompt,
  responseFormat = "json_object",
  maxRetries = 3,
  timeoutMs = 15000
}: GenerateCompletionParams): Promise<string> => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      if (!openai) {
        throw new Error("OpenAI API key is not configured");
      }

      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: responseFormat }
        },
        { signal: abortController.signal as any }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.choices[0].message.content) {
        throw new Error("Empty response from OpenAI");
      }
      
      return response.choices[0].message.content;
      
    } catch (error: any) {
      attempt++;
      console.warn(`[AI Service] Attempt ${attempt} failed: ${error.message}`);
      
      if (
        error.name === "AbortError" || 
        error.status === 429 || 
        (error.status && error.status >= 500)
      ) {
        if (attempt >= maxRetries) {
          throw new Error(`AI request failed after ${maxRetries} attempts: ${error.message}`);
        }
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await wait(backoffMs);
      } else {
        throw error;
      }
    }
  }
  
  throw new Error("AI Request Failed");
};
