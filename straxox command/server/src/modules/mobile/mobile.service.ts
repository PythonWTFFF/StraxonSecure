import webpush from "web-push";
import { prisma } from "../../lib/prisma";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "dummy_public_key";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "dummy_private_key";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@straxon.com";

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

export const sendPushNotification = async (userId: string, payload: any) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription has expired or is no longer valid, delete it
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error(`Failed to send push notification to subscription ${sub.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to send push notification for user ${userId}:`, error);
  }
};
