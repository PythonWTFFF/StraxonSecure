import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/queue";
import crypto from "crypto";

export const webhookWorker = new Worker(
  "webhookQueue",
  async (job: Job) => {
    const { url, payload, secret } = job.data;
    
    console.log(`[Webhook Worker] Sending webhook to ${url}`);
    
    try {
      const headers: any = {
        "Content-Type": "application/json",
      };

      if (secret) {
        const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
        headers["X-Straxon-Signature"] = signature;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
         throw new Error(`Webhook failed with status: ${response.status}`);
      }
      
      console.log(`[Webhook Worker] Successfully sent webhook to ${url}`);
    } catch (error) {
      console.error(`[Webhook Worker] Failed to send webhook to ${url}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  { 
    connection: redisConnection,
    // Add exponential backoff for webhooks
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        return Math.min(1000 * Math.pow(2, attemptsMade), 60000);
      }
    }
  }
);
