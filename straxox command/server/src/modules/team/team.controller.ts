import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import * as argon2 from "argon2";
import { aiQueue } from "../../lib/queue";

const inviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["Owner", "Admin", "Finance", "Sales", "Delivery", "Employee", "ReadOnly"]).default("Employee"),
  password: z.string().min(6),
});

export const getTeam = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        tasks: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
};

export const inviteTeamMember = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const result = inviteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const { name, email, role, password } = result.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }
    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await aiQueue.add("embedEntity", {
      type: "user",
      id: user.id,
      content: `Team member ${user.name} (${user.email}), Role: ${user.role}`,
      organizationId
    });

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to invite team member" });
  }
};

export const updateTeamMemberRole = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const { role } = req.body;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update role" });
  }
};

export const removeTeamMember = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot remove yourself" });
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "User not found" });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove team member" });
  }
};
