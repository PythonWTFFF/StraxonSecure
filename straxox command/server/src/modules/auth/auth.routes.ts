import { Router } from "express";
import { login, logout, getMe, refreshToken } from "./auth.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/firewall";

const router = Router();

router.post("/login", authRateLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.get("/me", authenticateJWT, getMe);

export default router;
