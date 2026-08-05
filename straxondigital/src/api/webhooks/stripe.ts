// Webhook handler scaffolding (Edge Function entry points to be added).
// Document expected events here so future integration is plug-and-play.

export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.deleted",
] as const;

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];
