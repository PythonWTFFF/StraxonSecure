import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { io } from "../../app";
import { z } from "zod";
import { EventPublisher } from "../../utils/EventPublisher";
import { aiQueue } from "../../lib/queue";

const eventPublisher = new EventPublisher();

const projectSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  status: z.enum(["active", "paused", "completed", "cancelled"]).default("active"),
  repoUrl: z.string().optional(),
  figmaUrl: z.string().optional(),
  envUrl: z.string().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["todo", "in-progress", "blocked", "review", "completed"]).default("todo"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const getProjects = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: { client: true, tasks: { include: { assignee: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProjectById = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { client: true, tasks: { include: { assignee: true } } },
    });
    if (!project || project.organizationId !== organizationId) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

export const createProject = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const result = projectSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const data = result.data;
    const project = await prisma.project.create({
      data: { ...data, organizationId },
      include: { client: true, tasks: true },
    });
    io.emit("invalidate_projects");
    io.emit("invalidate_dashboard");
    
    await aiQueue.add("embedEntity", {
      type: "project",
      id: project.id,
      content: `Project ${project.name} for client ${project.client.name}. Status: ${project.status}.`,
      organizationId
    });
    
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const updateProject = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Project not found" });
    }
    const result = projectSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const project = await prisma.project.update({
      where: { id },
      data: result.data,
      include: { client: true, tasks: { include: { assignee: true } } },
    });
    io.emit("invalidate_projects");
    io.emit("invalidate_dashboard");
    await eventPublisher.publish("project_updated", project, undefined, `org:${organizationId}`);
    
    await aiQueue.add("embedEntity", {
      type: "project",
      id: project.id,
      content: `Project ${project.name} for client ${project.client.name}. Status: ${project.status}.`,
      organizationId
    });

    res.json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Project not found" });
    }
    await prisma.project.delete({ where: { id } });
    io.emit("invalidate_projects");
    io.emit("invalidate_dashboard");
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

export const getTasks = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const tasks = await prisma.task.findMany({
      where: { projectId: id, organizationId },
      include: { assignee: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const createTask = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const result = taskSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const task = await prisma.task.create({
      data: { ...result.data, projectId: id, organizationId },
      include: { assignee: true },
    });
    io.emit("invalidate_tasks");
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const organizationId = req.user.organizationId;
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Task not found" });
    }
    const result = taskSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    const task = await prisma.task.update({
      where: { id: taskId },
      data: result.data,
      include: { assignee: true },
    });
    io.emit("invalidate_tasks");
    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const updateTaskStatus = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: { assignee: true },
    });
    io.emit("invalidate_tasks");
    res.json({ success: true, task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update task status" });
  }
};

export const deleteTask = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const organizationId = req.user.organizationId;
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Task not found" });
    }
    await prisma.task.delete({ where: { id: taskId } });
    io.emit("invalidate_tasks");
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
