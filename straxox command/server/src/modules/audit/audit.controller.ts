import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { io } from "../../app";

export const getAuditLogs = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    
    // We fetch recent audit logs and split them. Let's say actions with severity in metadata go to anomaly, others to system.
    const logs = await prisma.auditLogEntry.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const systemLogs = [];
    const anomalyLogs = [];

    for (const log of logs) {
      const meta = log.metadata as any || {};
      
      if (meta.anomaly || meta.severity) {
        anomalyLogs.push({
          id: log.id,
          time: log.createdAt.toISOString().replace("T", " ").slice(0, 19),
          ip: meta.ip || "Unknown",
          location: meta.location || "Unknown",
          action: log.action,
          severity: meta.severity || "MEDIUM"
        });
      } else {
        systemLogs.push({
          id: log.id,
          time: log.createdAt.toISOString().replace("T", " ").slice(0, 19),
          tag: meta.tag || "INFO",
          msg: log.action,
          category: meta.category || "system"
        });
      }
    }

    res.json({ systemLogs, anomalyLogs });
  } catch (error) {
    console.error("Audit log error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};

export const createAuditLog = async (data: { userId: string, action: string, entityType: string, entityId: string, metadata: any, organizationId: string }) => {
    try {
        const log = await prisma.auditLogEntry.create({
            data
        });
        io.emit("invalidate_audit");
        return log;
    } catch(err) {
        console.error("Failed to create audit log", err);
    }
}
