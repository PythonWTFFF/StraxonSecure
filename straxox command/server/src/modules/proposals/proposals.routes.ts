import { Router } from "express";
import { getProposals, createProposal } from "./proposals.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getProposals);
router.post("/", requireRole(["Owner", "Admin", "Sales"]), createProposal);

export default router;
