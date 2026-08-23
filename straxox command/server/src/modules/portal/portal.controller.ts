import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import crypto from "crypto";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback_missing_key", {
  apiVersion: "2024-06-20" as any,
});

export const generatePortalToken = async (req: any, res: Response) => {
  try {
    const { clientId } = req.body;
    const organizationId = req.user.organizationId;
    
    // Verify client belongs to org
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId }
    });
    
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    
    const session = await prisma.clientPortalSession.create({
      data: {
        clientId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
    
    res.json({ success: true, link: `http://localhost:5173/portal/${token}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate token" });
  }
};

export const getPortalData = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    
    const session = await prisma.clientPortalSession.findUnique({
      where: { token },
      include: { client: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    const clientId = session.clientId;
    
    // Fetch safe scoped data for the client
    const invoices = await prisma.invoice.findMany({
      where: { 
        organizationId: session.client.organizationId,
        clientName: session.client.name, // In a real app we should link by ID, but v1 used name
      },
      include: { lineItems: true }
    });
    
    const projects = await prisma.project.findMany({
      where: { clientId },
      include: { tasks: true }
    });

    res.json({
      client: session.client,
      invoices,
      projects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch portal data" });
  }
};

export const portalPayInvoice = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { invoiceId, amount, successUrl, cancelUrl } = req.body;

    const session = await prisma.clientPortalSession.findUnique({
      where: { token },
      include: { client: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, organizationId: session.client.organizationId },
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
    const stripeSession = await stripe.checkout.sessions.create({
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

    res.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Portal Pay Error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

export const portalSendMessage = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { content, threadId, subject } = req.body;

    const session = await prisma.clientPortalSession.findUnique({
      where: { token },
      include: { client: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    let activeThreadId = threadId;

    if (!activeThreadId) {
      // Create a new thread
      const thread = await prisma.thread.create({
        data: {
          clientId: session.clientId,
          subject: subject || "New Message from Portal",
          organizationId: session.client.organizationId
        }
      });
      activeThreadId = thread.id;
    }

    const message = await prisma.message.create({
      data: {
        threadId: activeThreadId,
        senderType: "client",
        senderId: session.clientId,
        content,
        organizationId: session.client.organizationId
      }
    });

    const { io } = require("../../app");
    io.emit("invalidate_communications");

    res.json({ success: true, message });
  } catch (error) {
    console.error("Portal Message Error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const portalSignProposal = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { proposalId } = req.body;

    const session = await prisma.clientPortalSession.findUnique({
      where: { token },
      include: { client: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId, organizationId: session.client.organizationId }
    });

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    // In a real app we'd attach a digital signature hash, 
    // for now we'll just log an audit event and mark it somehow.
    await prisma.auditLogEntry.create({
      data: {
        userId: session.clientId, // Client ID technically
        action: "PROPOSAL_SIGNED",
        entityType: "Proposal",
        entityId: proposalId,
        metadata: { clientName: session.client.name },
        organizationId: session.client.organizationId
      }
    });

    res.json({ success: true, message: "Proposal signed successfully" });
  } catch (error) {
    console.error("Portal Sign Error:", error);
    res.status(500).json({ error: "Failed to sign proposal" });
  }
};
