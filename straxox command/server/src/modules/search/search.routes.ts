import { Router } from "express";
import { globalSearch } from "./search.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", globalSearch);

export default router;
