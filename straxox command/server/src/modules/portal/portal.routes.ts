import { Router } from "express";
import { generatePortalToken, getPortalData, portalPayInvoice, portalSendMessage, portalSignProposal } from "./portal.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// Internal route for staff to generate a link
router.post("/generate", authenticateJWT, requireRole(["Owner", "Admin", "Sales"]), generatePortalToken);

// Public external route for the client to view data via token
router.get("/:token", getPortalData);
router.post("/:token/pay", portalPayInvoice);
router.post("/:token/message", portalSendMessage);
router.post("/:token/sign", portalSignProposal);

export default router;
