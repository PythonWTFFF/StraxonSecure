import { Router, raw } from "express";
import { createCheckoutSession, handleWebhook } from "./billing.controller";

const router = Router();

router.post("/checkout", createCheckoutSession);
// Webhook needs raw body parsing
router.post("/webhook", raw({ type: "application/json" }), handleWebhook);

export default router;
