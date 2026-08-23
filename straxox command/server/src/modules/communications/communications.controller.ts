import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { emailQueue, aiQueue } from "../../lib/queue";
import { io } from "../../app";

export const sendInvoiceEmail = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });
    
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const client = await prisma.client.findFirst({
      where: { name: invoice.clientName, organizationId: invoice.organizationId }
    });

    if (!client) return res.status(404).json({ error: "Linked client not found for this invoice" });

    // Generate or fetch a portal token for this client so they can pay it
    let portalSession = await prisma.clientPortalSession.findFirst({
      where: { clientId: client.id }
    });

    if (!portalSession) {
      const crypto = require("crypto");
      portalSession = await prisma.clientPortalSession.create({
        data: {
          clientId: client.id,
          token: crypto.randomBytes(32).toString("hex"),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    const portalLink = `http://localhost:5173/portal/${portalSession.token}`;

    // Enqueue the job for background processing
    await emailQueue.add("sendInvoiceEmail", {
      invoiceId,
      email: invoice.clientEmail,
      token: portalSession.token,
      url: portalLink
    });
    
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "sent" }
    });

    res.json({ success: true, message: "Email queued for sending" });
  } catch (error: any) {
    console.error("Resend error:", error);
    res.status(500).json({ error: "Failed to send invoice email" });
  }
};

export const getThreads = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const threads = await prisma.thread.findMany({
      where: { organizationId },
      include: { client: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" }
    });
    res.json(threads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
};

export const getThreadById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const thread = await prisma.thread.findUnique({
      where: { id, organizationId },
      include: { client: true, messages: { orderBy: { createdAt: "asc" } } }
    });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
};

export const createThread = async (req: any, res: Response) => {
  try {
    const { clientId, subject, message } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    const thread = await prisma.thread.create({
      data: {
        clientId,
        subject,
        organizationId,
        messages: {
          create: {
            senderType: "agency",
            senderId: userId,
            content: message,
            organizationId
          }
        }
      },
      include: { messages: true, client: true }
    });

    await aiQueue.add("embedEntity", {
      type: "message",
      id: thread.messages[0].id,
      content: `Message in thread ${thread.subject} with ${thread.client.name}: ${message}`,
      organizationId
    });

    io.emit("invalidate_communications");
    res.status(201).json({ success: true, thread });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create thread" });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    const thread = await prisma.thread.findUnique({ where: { id: threadId, organizationId }, include: { client: true } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    const message = await prisma.message.create({
      data: {
        threadId,
        senderType: "agency",
        senderId: userId,
        content,
        organizationId
      }
    });

    // Update thread updatedAt to bump it to top
    await prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });

    await aiQueue.add("embedEntity", {
      type: "message",
      id: message.id,
      content: `Message in thread ${thread.subject} with ${thread.client.name}: ${content}`,
      organizationId
    });

    io.emit("invalidate_communications");
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const handleResendWebhook = async (req: Request, res: Response) => {
  try {
    // Note: Verify Resend webhook signature here in a real app
    const event = req.body;
    
    // Example: tracking delivery/read status
    if (event.type === "email.delivered" || event.type === "email.opened") {
      const resendMessageId = event.data?.email_id;
      if (resendMessageId) {
        await prisma.message.updateMany({
          where: { resendMessageId },
          data: { status: event.type === "email.opened" ? "read" : "delivered" }
        });
        io.emit("invalidate_communications");
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error("Resend Webhook Error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};
