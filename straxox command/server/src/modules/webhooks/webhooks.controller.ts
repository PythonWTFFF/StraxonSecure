import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export const getWebhooks = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const webhooks = await prisma.outboundWebhook.findMany({
      where: { organizationId }
    });
    res.json(webhooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
};

export const createWebhook = async (req: any, res: Response) => {
  try {
    const { url, event, secret } = req.body;
    const organizationId = req.user.organizationId;
    
    if (!url || !event) {
      return res.status(400).json({ error: "URL and Event are required" });
    }

    const webhook = await prisma.outboundWebhook.create({
      data: {
        url,
        event,
        secret,
        organizationId
      }
    });

    res.status(201).json({ success: true, webhook });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
};

export const updateWebhook = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const organizationId = req.user.organizationId;

    const webhook = await prisma.outboundWebhook.update({
      where: { id, organizationId },
      data: { isActive }
    });

    res.json({ success: true, webhook });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update webhook" });
  }
};

export const deleteWebhook = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    await prisma.outboundWebhook.delete({
      where: { id, organizationId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
};
