import { Router } from "express";
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from "./deals.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
router.use(authenticateJWT);

router.get("/", getDeals);
router.get("/:id", getDealById);
router.post("/", createDeal);
router.put("/:id", updateDeal);
router.patch("/:id/stage", updateDealStage);
router.delete("/:id", deleteDeal);

export default router;
