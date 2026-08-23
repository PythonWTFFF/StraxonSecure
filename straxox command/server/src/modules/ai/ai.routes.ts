import { Router } from "express";
import { handleQuery, syncEmbedding, draftProposal, getClientSummary } from "./ai.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

// Protect the AI endpoints
router.use(authenticateJWT);

router.post("/query", handleQuery);
router.post("/embeddings/sync", syncEmbedding);
router.post("/proposals/draft", draftProposal);
router.get("/clients/:id/summary", getClientSummary);

export default router;
