import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { systemQueue } from "../../lib/queue"; // We might use systemQueue for assembling data payloads

export const getRequests = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const requests = await prisma.dataSubjectRequest.findMany({
      where: { organizationId },
      orderBy: { requestedAt: "desc" }
    });
    res.json(requests);
  } catch (error) {
    console.error("Failed to fetch compliance requests:", error);
    res.status(500).json({ error: "Failed to fetch data subject requests" });
  }
};

export const createRequest = async (req: any, res: Response) => {
  try {
    const { requestType, subjectType, subjectId } = req.body;
    const organizationId = req.user.organizationId;
    const requestedBy = req.user.id;

    if (!["export", "erase", "rectify"].includes(requestType)) {
      return res.status(400).json({ error: "Invalid requestType" });
    }

    const dpr = await prisma.dataSubjectRequest.create({
      data: {
        requestType,
        subjectType,
        subjectId,
        requestedBy,
        organizationId
      }
    });

    res.status(201).json({ success: true, request: dpr });
  } catch (error) {
    console.error("Failed to create compliance request:", error);
    res.status(500).json({ error: "Failed to create data subject request" });
  }
};

export const fulfillRequest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const dpr = await prisma.dataSubjectRequest.findUnique({
      where: { id, organizationId }
    });

    if (!dpr) {
      return res.status(404).json({ error: "Request not found" });
    }

    // In a full implementation, this triggers a BullMQ worker to generate the export or do the erasure.
    // For now, we queue it to a system queue.
    await systemQueue.add("fulfillComplianceRequest", { requestId: dpr.id });

    const updated = await prisma.dataSubjectRequest.update({
      where: { id },
      data: { status: "processing" }
    });

    res.json({ success: true, request: updated });
  } catch (error) {
    console.error("Failed to fulfill compliance request:", error);
    res.status(500).json({ error: "Failed to process data subject request" });
  }
};

export const getRetentionStatus = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const policies = await prisma.retentionPolicy.findMany({
      where: { organizationId }
    });
    res.json(policies);
  } catch (error) {
    console.error("Failed to fetch retention status:", error);
    res.status(500).json({ error: "Failed to fetch retention status" });
  }
};
