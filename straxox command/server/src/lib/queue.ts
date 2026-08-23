import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

// Standardize redis connection for BullMQ
export const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
redisConnection.on("error", () => {}); // Prevent crash if Redis isn't running locally

// Create Queues
export const emailQueue = new Queue("emailQueue", { connection: redisConnection });
export const webhookQueue = new Queue("webhookQueue", { connection: redisConnection });
export const systemQueue = new Queue("systemQueue", { connection: redisConnection });
export const scheduledQueue = new Queue("scheduledQueue", { connection: redisConnection });
export const aiQueue = new Queue("aiQueue", { connection: redisConnection });

// Initialize queue events (optional, useful for logging)
const emailQueueEvents = new QueueEvents("emailQueue", { connection: redisConnection });

emailQueueEvents.on("completed", ({ jobId }) => {
  console.log(`[BullMQ] Email Job ${jobId} completed successfully`);
});

emailQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`[BullMQ] Email Job ${jobId} failed: ${failedReason}`);
});

