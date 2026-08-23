import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/queue";
import { prisma } from "../lib/prisma";
import OpenAI from "openai";
import { generateCompletion } from "../modules/ai/ai.service";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export const aiWorker = new Worker(
  "aiQueue",
  async (job: Job) => {
    switch (job.name) {
      case "embedEntity": {
        const { id, type, content, organizationId } = job.data;
        console.log(`[AI Worker] Generating embedding for ${type} ${id}`);
        try {
          if (!openai) {
            console.warn(`[AI Worker] Skipping embedding for ${type} ${id} because OpenAI API key is missing.`);
            return;
          }
          const res = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: content,
          });
          const embedding = res.data[0].embedding;
          
          // Use prisma.$executeRawUnsafe to insert the vector because prisma doesn't fully support vector writes yet
          await prisma.$executeRawUnsafe(
            `DELETE FROM "AIInsight" WHERE "sourceType" = $1 AND "sourceId" = $2 AND "organizationId" = $3`,
            type, id, organizationId
          );
          
          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "AIInsight" ("id", "sourceType", "sourceId", "content", "embedding", "organizationId", "createdAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, $5, NOW())
            `,
            type, id, content, `[${embedding.join(",")}]`, organizationId
          );
          
          console.log(`[AI Worker] Successfully embedded ${type} ${id}`);
        } catch (error) {
          console.error(`[AI Worker] Failed to embed ${type}:`, error);
          throw error;
        }
        break;
      }
      
      case "aiDealCopilot": {
        console.log(`[AI Worker] Running Deal Copilot...`);
        try {
          const { dealId } = job.data;
          
          const deal = await prisma.deal.findUnique({
            where: { id: dealId },
            include: { client: true }
          });
          
          if (!deal || deal.stage === "Won" || deal.stage === "Lost") return;

          const prompt = `
          You are an expert sales copilot for an agency. This deal is stalled.
          Client: ${deal.client.name}
          Deal ID: ${deal.id}
          Value: $${deal.value}
          Notes: ${deal.notes || 'None'}
          
          Write a concise, friendly follow-up email to the client to re-engage them. 
          Return ONLY a JSON object with:
          - subject: The email subject line.
          - body: The email body text.
          `;

          const responseStr = await generateCompletion({ prompt, responseFormat: "json_object" });
          const draft = JSON.parse(responseStr);
          
          // Create a thread and a draft message
          const thread = await prisma.thread.create({
            data: {
              clientId: deal.clientId,
              subject: `[DRAFT] ${draft.subject}`,
              organizationId: deal.organizationId,
              messages: {
                create: {
                  senderType: "agency",
                  senderId: "AI_COPILOT",
                  content: draft.body,
                  organizationId: deal.organizationId,
                  status: "draft"
                }
              }
            }
          });
          
          console.log(`[AI Worker] Drafted follow up for Deal ${dealId} in Thread ${thread.id}`);
        } catch (err) {
          console.error(`[AI Worker] Copilot failed for deal ${job.data.dealId}:`, err);
        }
        break;
      }
      
      default:
        console.warn(`[AI Worker] Unknown job name: ${job.name}`);
    }
  },
  { connection: redisConnection }
);
