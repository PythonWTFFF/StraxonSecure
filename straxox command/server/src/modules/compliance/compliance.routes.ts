import { Router } from "express";
import { getRequests, createRequest, fulfillRequest, getRetentionStatus } from "./compliance.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(["Owner", "Admin"])); // Data Subject requests are strictly for Admin/Owner

router.get("/requests", getRequests);
router.post("/requests", createRequest);
router.post("/requests/:id/fulfill", fulfillRequest);
router.get("/retention-status", getRetentionStatus);

export default router;
