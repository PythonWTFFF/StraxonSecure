import { Request, Response } from "express";
import { z } from "zod";
import { io } from "../../app";
import { prisma } from "../../lib/prisma";
import { aiQueue } from "../../lib/queue";

const clientSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  ltv: z.number(),
  projects: z.number(),
  industry: z.string(),
  color: z.string(),
  ip: z.string().optional(),
  repo: z.string().optional(),
  figma: z.string().optional(),
  env: z.string().optional(),
  invoiceDue: z.string().optional(),
});

export const getClients = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const clients = await prisma.client.findMany({ 
      where: { organizationId },
      orderBy: { createdAt: "desc" } 
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
};

export const createClient = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const result = clientSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    const client = await prisma.client.create({ 
      data: {
        ...result.data,
        organizationId
      }
    });
    io.emit("invalidate_clients");
    io.emit("invalidate_dashboard");
    
    await aiQueue.add("embedEntity", {
      type: "client",
      id: client.id,
      content: `Client ${client.name} in industry ${client.industry}.`,
      organizationId
    });
    
    res.status(201).json({ success: true, client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create client" });
  }
};
