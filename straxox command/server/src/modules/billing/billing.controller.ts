import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { io } from "../../app";
import { emitWebhookEvent } from "../webhooks/webhook.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback_missing_key", {
  apiVersion: "2024-06-20" as any, // Bypass strict type check for API version in case Stripe updates their sdk
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { invoiceId, successUrl, cancelUrl, amount } = req.body;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true }
    });
    
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (invoice.status === "paid" || invoice.paymentStatus === "paid") {
      return res.status(400).json({ error: "Invoice is already paid" });
    }

    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.rate * item.quantity), 0);
    const invoiceTotal = subtotal + (subtotal * (invoice.taxRate / 100));
    const totalRemaining = invoiceTotal - (invoice.amountPaid || 0);
    
    const amountToCharge = amount ? Math.min(amount, totalRemaining) : totalRemaining;
    if (amountToCharge <= 0) return res.status(400).json({ error: "Invalid amount to charge" });

    // Create a stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
              description: `Payment for ${invoice.clientName}`,
            },
            unit_amount: Math.round(amountToCharge * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: invoice.id,
      metadata: {
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
        amountCharged: String(amountToCharge)
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event;
  try {
    // In Express, req.body must be raw buffer for webhook signature validation.
    // Assuming app.ts handles express.raw() for the webhook route.
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      const amountCharged = parseFloat(session.metadata?.amountCharged || "0");
      
      if (invoiceId) {
        const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { lineItems: true } });
        if (inv) {
          const subtotal = inv.lineItems.reduce((acc, item) => acc + (item.rate * item.quantity), 0);
          const invTotal = subtotal + (subtotal * (inv.taxRate / 100));
          const newAmountPaid = (inv.amountPaid || 0) + amountCharged;
          const isFullyPaid = newAmountPaid >= invTotal - 0.01; // allow small float diff

          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: isFullyPaid ? "paid" : "partially_paid",
              paymentStatus: isFullyPaid ? "paid" : "partially_paid",
              paymentDate: new Date(),
              amountPaid: newAmountPaid,
              stripePaymentIntentId: session.payment_intent as string,
            }
          });
          
          if (isFullyPaid) {
            await emitWebhookEvent(inv.organizationId, "invoice.paid", inv);
          }
          io.emit("invalidate_dashboard");
          io.emit("invalidate_invoices");
        }
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      // We need to find the invoice by payment intent ID
      if (charge.payment_intent) {
        const inv = await prisma.invoice.findFirst({
          where: { stripePaymentIntentId: charge.payment_intent as string }
        });
        if (inv) {
          const amountRefunded = charge.amount_refunded / 100;
          const newAmountPaid = Math.max(0, (inv.amountPaid || 0) - amountRefunded);
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              status: newAmountPaid > 0 ? "partially_paid" : "sent",
              paymentStatus: newAmountPaid > 0 ? "partially_paid" : "unpaid",
              amountPaid: newAmountPaid
            }
          });
          const { io } = require("../../app");
          io.emit("invalidate_dashboard");
          io.emit("invalidate_invoices");
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      // Typically used with Stripe subscriptions, but we can handle it if we create Stripe invoices.
      // If we use checkout sessions, a failed payment just doesn't complete the session.
      // However, if we do have a metadata invoice ID:
      const stripeInvoice = event.data.object as Stripe.Invoice;
      console.log(`Payment failed for Stripe invoice ${stripeInvoice.id}`);
      // In a real dunning scenario, we'd enqueue an email job here.
      const { emailQueue } = require("../../lib/queue");
      if (stripeInvoice.customer_email) {
        await emailQueue.add("paymentFailedEmail", { email: stripeInvoice.customer_email });
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};
