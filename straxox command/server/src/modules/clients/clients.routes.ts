import { Router } from "express";
import { getClients, createClient } from "./clients.controller";
import { authenticateJWT, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getClients);
router.post("/", requireRole(["Owner", "Admin", "Sales", "Finance"]), createClient);

export default router;
