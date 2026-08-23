import { Request, Response } from "express";
import { io } from "../../app";
import { prisma } from "../../lib/prisma";

export const getProposals = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const proposals = await prisma.proposal.findMany({ 
      where: { organizationId },
      orderBy: { createdAt: "desc" } 
    });
    // With JSONB, they are already objects/arrays, no need to JSON.parse
    res.json(proposals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
};

export const createProposal = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const data = req.body;
    const proposal = await prisma.proposal.create({
      data: {
        docType: data.docType,
        refNum: data.refNum,
        clientName: data.clientName,
        projectName: data.projectName,
        author: data.author,
        version: data.version,
        date: data.date,
        industry: data.industry,
        contactEmail: data.contactEmail,
        executiveSummary: data.executiveSummary,
        systemScope: data.systemScope,
        objectives: data.objectives,
        techStack: data.techStack,
        nfReqs: data.nfReqs,
        apiNotes: data.apiNotes,
        progressBody: data.progressBody,
        budgetTotal: data.budgetTotal,
        budgetSpent: data.budgetSpent,
        nextSteps: data.nextSteps,
        reqs: data.reqs || [],
        milestones: data.milestones || [],
        team: data.team || [],
        risks: data.risks || [],
        organizationId,
      }
    });
    io.emit("invalidate_proposals");
    res.status(201).json({ success: true, proposal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create proposal" });
  }
};
