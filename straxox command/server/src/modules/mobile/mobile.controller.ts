import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export const subscribePush = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { subscription, deviceType } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }

    const { endpoint, keys: { p256dh, auth } } = subscription;

    // We use upsert on endpoint, but currently PushSubscription doesn't have a unique constraint on endpoint.
    // Let's just find and create, or find and update.
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint }
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId, p256dh, auth, deviceType: deviceType || "web" }
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint,
          p256dh,
          auth,
          deviceType: deviceType || "web"
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    res.status(500).json({ error: "Failed to subscribe to push notifications" });
  }
};
