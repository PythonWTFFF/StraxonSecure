import { Router } from "express";
import { getAuditLogs } from "./audit.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAuditLogs);

export default router;
