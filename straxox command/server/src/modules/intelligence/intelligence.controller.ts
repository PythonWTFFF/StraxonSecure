import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export const getIntelligenceOverview = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;

    // Revenue by month (last 6 months from invoices)
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: { lineItems: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyRevenue: Record<string, number> = {};
    for (const inv of invoices) {
      const month = new Date(inv.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
      const total = inv.lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + total;
    }
    const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

    // Deals pipeline by stage
    const deals = await prisma.deal.findMany({
      where: { organizationId },
      include: { client: true },
    });
    const stageMap: Record<string, { count: number; value: number }> = {};
    for (const deal of deals) {
      if (!stageMap[deal.stage]) stageMap[deal.stage] = { count: 0, value: 0 };
      stageMap[deal.stage].count++;
      stageMap[deal.stage].value += deal.value;
    }
    const dealsByStage = Object.entries(stageMap).map(([stage, data]) => ({ stage, ...data }));

    // Projects summary
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: { tasks: true },
    });
    const projectHealth = projects.map((p) => {
      const total = p.tasks.length;
      const completed = p.tasks.filter((t) => t.status === "completed").length;
      const blocked = p.tasks.filter((t) => t.status === "blocked").length;
      const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        progress,
        totalTasks: total,
        completedTasks: completed,
        blockedTasks: blocked,
        health: blocked > 0 ? "at-risk" : progress >= 75 ? "on-track" : progress >= 30 ? "in-progress" : "early",
      };
    });

    // Clients by LTV
    const clients = await prisma.client.findMany({
      where: { organizationId },
      orderBy: { ltv: "desc" },
      take: 10,
    });
    const topClientsByLTV = clients.map((c) => ({ name: c.name, ltv: c.ltv, health: c.health, industry: c.industry }));

    // Invoice aging
    const now = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90plus: 0, paid: 0 };
    for (const inv of invoices) {
      if (inv.paymentStatus === "paid") { aging.paid++; continue; }
      const dueDate = new Date(inv.dueDate);
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) aging.current++;
      else if (diffDays <= 30) aging.days30++;
      else if (diffDays <= 60) aging.days60++;
      else aging.days90plus++;
    }
    const invoiceAging = [
      { label: "Current", value: aging.current },
      { label: "1-30 days", value: aging.days30 },
      { label: "31-60 days", value: aging.days60 },
      { label: "60+ days", value: aging.days90plus },
      { label: "Paid", value: aging.paid },
    ];

    // Summary KPIs
    const totalRevenue = invoices
      .filter((i) => i.paymentStatus === "paid")
      .reduce((sum, i) => sum + i.lineItems.reduce((s, li) => s + li.quantity * li.rate, 0), 0);
    const totalPipelineValue = deals.filter((d) => !["Won", "Lost"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
    const wonDealsValue = deals.filter((d) => d.stage === "Won").reduce((s, d) => s + d.value, 0);
    const conversionRate = deals.length === 0 ? 0 : Math.round((deals.filter((d) => d.stage === "Won").length / deals.length) * 100);

    res.json({
      kpis: {
        totalRevenue,
        totalPipelineValue,
        wonDealsValue,
        conversionRate,
        totalClients: clients.length,
        activeProjects: projects.filter((p) => p.status === "active").length,
      },
      revenueByMonth,
      dealsByStage,
      projectHealth,
      topClientsByLTV,
      invoiceAging,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch intelligence data" });
  }
};
