import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "./projects.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
router.use(authenticateJWT);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

router.get("/:id/tasks", getTasks);
router.post("/:id/tasks", createTask);
router.patch("/tasks/:taskId/status", updateTaskStatus);
router.put("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);

export default router;
