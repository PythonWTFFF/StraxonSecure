import { Router } from "express";
import { getIntelligenceOverview } from "./intelligence.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
router.use(authenticateJWT);

router.get("/overview", getIntelligenceOverview);

export default router;
