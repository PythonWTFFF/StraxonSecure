import { Router } from "express";
import { renderDocument } from "./documents.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

// Protect all document routes
router.use(authenticateJWT);

router.post("/render", requireRole(["Owner", "Admin", "Employee"]), renderDocument);

export default router;
