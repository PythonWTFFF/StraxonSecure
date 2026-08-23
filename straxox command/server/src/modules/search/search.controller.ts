import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import OpenAI from "openai";

export const globalSearch = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchStr = `%${query}%`;
    const results = [];

    // Search Clients
    const clients = await (prisma.client as any).cachedFindMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }, 60);
    for (const c of clients) {
      results.push({
        id: `client-${c.id}`,
        type: "client",
        title: c.name,
        subtitle: c.email,
        url: `/clients`, // Simplified for now since clients page doesn't have individual routes yet
      });
    }

    // Search Projects
    const projects = await (prisma.project as any).cachedFindMany({
      where: {
        organizationId,
        name: { contains: query, mode: "insensitive" },
      },
      include: { client: true },
      take: 5,
    }, 60);
    for (const p of projects) {
      results.push({
        id: `project-${p.id}`,
        type: "project",
        title: p.name,
        subtitle: `Client: ${p.client.name}`,
        url: `/projects`,
      });
    }

    // Search Invoices
    const invoices = await (prisma.invoice as any).cachedFindMany({
      where: {
        organizationId,
        OR: [
          { invoiceNumber: { contains: query, mode: "insensitive" } },
          { clientName: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }, 60);
    for (const i of invoices) {
      results.push({
        id: `invoice-${i.id}`,
        type: "invoice",
        title: `Invoice ${i.invoiceNumber}`,
        subtitle: `Client: ${i.clientName} - Amount: ${i.currency}`, // Would be better to calculate total, but keeping it simple for search
        url: `/invoices`,
      });
    }

    // Search Proposals
    const proposals = await (prisma.proposal as any).cachedFindMany({
      where: {
        organizationId,
        OR: [
          { refNum: { contains: query, mode: "insensitive" } },
          { clientName: { contains: query, mode: "insensitive" } },
          { projectName: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }, 60);
    for (const p of proposals) {
      results.push({
        id: `proposal-${p.id}`,
        type: "proposal",
        title: `${p.docType} ${p.refNum}`,
        subtitle: `Client: ${p.clientName} - Project: ${p.projectName}`,
        url: `/proposals`,
      });
    }

    // Search Deals
    const deals = await (prisma.deal as any).cachedFindMany({
      where: {
        organizationId,
        OR: [
          { notes: { contains: query, mode: "insensitive" } },
          { client: { name: { contains: query, mode: "insensitive" } } }
        ],
      },
      include: { client: true },
      take: 5,
    }, 60);
    for (const d of deals) {
      results.push({
        id: `deal-${d.id}`,
        type: "deal",
        title: `Deal with ${d.client.name}`,
        subtitle: `Stage: ${d.stage} - Value: ${d.value}`,
        url: `/deals`,
      });
    }

    // Search Team (Users)
    const users = await (prisma.user as any).cachedFindMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }, 60);
    for (const u of users) {
      results.push({
        id: `user-${u.id}`,
        type: "user",
        title: u.name,
        subtitle: `${u.role} - ${u.email}`,
        url: `/team`,
      });
    }

    // Search Messages
    const messages = await (prisma.message as any).cachedFindMany({
      where: {
        organizationId,
        content: { contains: query, mode: "insensitive" },
      },
      include: { thread: { include: { client: true } } },
      take: 5,
    }, 60);
    for (const m of messages) {
      results.push({
        id: `message-${m.id}`,
        type: "message",
        title: `Message in thread: ${m.thread.subject}`,
        subtitle: `Client: ${m.thread.client.name}`,
        url: `/communications`,
      });
    }

    try {
      // Perform Semantic Search using pgvector
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const embedRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      const embedding = embedRes.data[0].embedding;
      const vecStr = `[${embedding.join(",")}]`;

      const aiResults: any[] = await prisma.$queryRawUnsafe(`
        SELECT "sourceId", "sourceType", "content", 1 - (embedding <=> $1::vector) AS similarity
        FROM "AIInsight"
        WHERE "organizationId" = $2
        ORDER BY embedding <=> $1::vector
        LIMIT 5
      `, vecStr, organizationId);

      for (const r of aiResults) {
        // Prevent exact duplicates if keyword search already found it
        const exists = results.some(x => x.id === `${r.sourceType}-${r.sourceId}`);
        if (!exists && r.similarity > 0.3) {
           results.push({
             id: `${r.sourceType}-${r.sourceId}-semantic`,
             type: r.sourceType,
             title: `Semantic Match: ${r.sourceType}`,
             subtitle: r.content.substring(0, 60) + "...",
             url: `/${r.sourceType}s`,
           });
        }
      }
    } catch (aiErr) {
      console.error("Semantic search failed:", aiErr);
    }

    return res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform global search" });
  }
};
