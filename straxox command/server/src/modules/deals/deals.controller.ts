import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { io } from "../../app";
import { z } from "zod";
import { EventPublisher } from "../../utils/EventPublisher";
import { emailQueue, aiQueue } from "../../lib/queue";
import { emitWebhookEvent } from "../webhooks/webhook.service";

const eventPublisher = new EventPublisher();

const dealSchema = z.object({
  clientId: z.string(),
  stage: z.enum(["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]).default("Lead"),
  value: z.number().min(0).default(0),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
});

export const getDeals = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const deals = await prisma.deal.findMany({
      where: { organizationId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(deals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
};

export const getDealById = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!deal || deal.organizationId !== organizationId) {
      return res.status(404).json({ error: "Deal not found" });
    }
    res.json(deal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch deal" });
  }
};

export const createDeal = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const result = dealSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const data = result.data;
    const deal = await prisma.deal.create({
      data: { ...data, organizationId },
      include: { client: true },
    });
    io.emit("invalidate_deals");
    io.emit("invalidate_dashboard");
    
    await aiQueue.add("embedEntity", {
      type: "deal",
      id: deal.id,
      content: `Deal for client ${deal.client.name}, stage: ${deal.stage}, value: ${deal.value}. Notes: ${deal.notes || ''}`,
      organizationId
    });
    
    res.status(201).json({ success: true, deal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create deal" });
  }
};

export const updateDeal = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Deal not found" });
    }
    const result = dealSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const deal = await prisma.deal.update({
      where: { id },
      data: result.data,
      include: { client: true },
    });
    io.emit("invalidate_deals");
    io.emit("invalidate_dashboard");
    await eventPublisher.publish("deal_updated", deal, undefined, `org:${organizationId}`);
    
    await aiQueue.add("embedEntity", {
      type: "deal",
      id: deal.id,
      content: `Deal for client ${deal.client.name}, stage: ${deal.stage}, value: ${deal.value}. Notes: ${deal.notes || ''}`,
      organizationId
    });
    
    if (result.data.stage === "Won" && existing.stage !== "Won") {
      await emitWebhookEvent(organizationId, "deal.won", deal);
    } else if (result.data.stage === "Lost" && existing.stage !== "Lost") {
      await emitWebhookEvent(organizationId, "deal.lost", deal);
    }

    res.json({ success: true, deal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update deal" });
  }
};

export const updateDealStage = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { stage } = req.body;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Deal not found" });
    }
    const deal = await prisma.deal.update({
      where: { id },
      data: { stage },
      include: { client: true },
    });
    io.emit("invalidate_deals");
    io.emit("invalidate_dashboard");
    await eventPublisher.publish("deal_updated", deal, undefined, `org:${organizationId}`);
    
    if (stage === "Won" && existing.stage !== "Won") {
      await emailQueue.add("dealWonEmail", {
        dealId: deal.id,
        email: deal.client.email,
        clientName: deal.client.name,
      });
      await emitWebhookEvent(organizationId, "deal.won", deal);
    } else if (stage === "Lost" && existing.stage !== "Lost") {
      await emitWebhookEvent(organizationId, "deal.lost", deal);
    }

    res.json({ success: true, deal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update deal stage" });
  }
};

export const deleteDeal = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Deal not found" });
    }
    await prisma.deal.delete({ where: { id } });
    io.emit("invalidate_deals");
    io.emit("invalidate_dashboard");
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete deal" });
  }
};
