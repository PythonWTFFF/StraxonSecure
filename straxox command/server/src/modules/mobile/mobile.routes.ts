import { Router } from "express";
import { subscribePush } from "./mobile.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.post("/push-subscribe", subscribePush);

export default router;
