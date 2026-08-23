import { Router } from "express";
import { sendInvoiceEmail, getThreads, getThreadById, createThread, sendMessage, handleResendWebhook } from "./communications.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// Webhook for resend, must be unauthenticated
router.post("/webhook", handleResendWebhook);

router.use(authenticateJWT);

router.get("/threads", getThreads);
router.get("/threads/:id", getThreadById);
router.post("/threads", createThread);
router.post("/threads/:threadId/messages", sendMessage);

router.post("/send-invoice", requireRole(["Owner", "Admin", "Sales"]), sendInvoiceEmail);

export default router;
