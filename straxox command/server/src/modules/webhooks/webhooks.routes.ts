import { Router } from "express";
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from "./webhooks.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(["Owner", "Admin"])); // Only high-level roles should manage webhooks

router.get("/", getWebhooks);
router.post("/", createWebhook);
router.patch("/:id", updateWebhook);
router.delete("/:id", deleteWebhook);

export default router;
