import { Router } from "express";
import { getDashboardData } from "./dashboard.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);
router.get("/", getDashboardData);

export default router;
