import { prisma } from "../../lib/prisma";
import { webhookQueue } from "../../lib/queue";

export const emitWebhookEvent = async (organizationId: string, event: string, payload: any) => {
  try {
    // Find webhooks matching this event or wildcard
    const webhooks = await prisma.outboundWebhook.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { event },
          { event: "*" }
        ]
      }
    });

    for (const webhook of webhooks) {
      await webhookQueue.add("sendWebhook", {
        url: webhook.url,
        secret: webhook.secret,
        payload: {
          event,
          timestamp: new Date().toISOString(),
          data: payload
        }
      });
    }
  } catch (error) {
    console.error(`Failed to emit webhook event ${event}:`, error);
  }
};
